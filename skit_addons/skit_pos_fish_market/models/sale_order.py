# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _
from datetime import datetime
from dateutil.relativedelta import relativedelta


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    state = fields.Selection(selection_add=[('preparing', 'Preparing'),
                                            ('ready', 'Ready to Delivery'),
                                            ('delivered', 'Delivered'),
                                            ('payment', 'Payment')],
                             string='Status', readonly=True, copy=False,
                             index=True, track_visibility='onchange',
                             track_sequence=3, default='draft'
                             )

    @api.multi
    @api.depends('state')
    def _compute_type_name(self):
        for record in self:
            record.type_name = _('Quotation') if record.state in ('draft', 'sent', 'cancel') else _('Sales Order')

    @api.multi
    @api.depends('team_id.team_type', 'date_order', 'order_line', 'state', 'partner_id')
    def _compute_abandoned_cart(self):
        for orderval in self:
            abandoned_delay = orderval.website_id and orderval.website_id.cart_abandoned_delay or 1.0
            abandoned_datetime = datetime.utcnow() - relativedelta(hours=abandoned_delay)
            for order in self:
                domain = order.date_order <= abandoned_datetime and order.team_id.team_type == 'website' and order.state == 'draft' and order.partner_id.id != self.env.ref('base.public_partner').id and order.order_line
                order.is_abandoned_cart = bool(domain)

    def check_fields_to_send(self, vals):
        fields = self.env["ir.config_parameter"].sudo().get_param("pos_sale_sync.sale_sync_field_ids", default=False)
        if not fields:
            return False
        field_names = self.env['ir.model.fields'].browse([int(x) for x in fields.split(',')]).mapped('name')
        for name in field_names:
            if name in vals:
                return True
        return False

    @api.multi
    def write(self, vals):
        result = super(SaleOrder, self).write(vals)
        if self.check_fields_to_send(vals):
            self.send_field_updates(self.ids)
        return result

    @api.model
    def create(self, vals):
        partner = super(SaleOrder, self).create(vals)
        if self.check_fields_to_send(vals):
            self.send_field_updates([partner.id])
        return partner

    @api.multi
    def unlink(self):
        res = super(SaleOrder, self).unlink()
        self.send_field_updates(self.ids, action='unlink')
        return res

    @api.model
    def send_field_updates(self, order_ids, action=''):
        channel_name = "pos_sale_sync"
        data = {'message': 'update_sorder_fields', 'action': action,
                'order_ids': order_ids}
        self.env['pos.config'].send_to_all_poses(channel_name, data)

    @api.multi
    def change_order_state(self, order_id, order_state):
        sale_order = self.env['sale.order'].sudo().search([
            ('id', '=', int(order_id))])
        if(order_state == "Order Confirm"):
            sale_order.action_confirm()
            account_invoice = self.env['account.invoice']
            account_invoice_line = self.env['account.invoice.line']
            journal_id = self.env['account.journal'].search([
                                 ('type', '=', 'sale'),
                                 ], limit=1)
            invoice_val = {'partner_id': sale_order.partner_id.id,
                           'date_invoice': fields.Date.context_today(self),
                           'origin': sale_order.name,
                           'type': 'out_invoice',
                           'journal_id': journal_id.id
                           }
            invoice = account_invoice.create(invoice_val)
            for line in sale_order.order_line:
                invoice_line_val = {
                                    'product_id': line.product_id.id,
                                    'account_id': journal_id.default_debit_account_id.id,
                                    'price_unit': line.price_unit,
                                    'name': line.product_id.name,
                                    'invoice_line_tax_ids': [(6, 0, line.tax_id.ids)],
                                    'invoice_id': invoice.id,
                                    }
                account_invoice_line.create(invoice_line_val)
            invoice._compute_amount()
            invoice.compute_taxes()
            invoice._compute_residual()
        elif(order_state == "Preparing"):
            sale_order.write({'state': 'preparing'})
        elif(order_state == "Ready to Delivery"):
            sale_order.write({'state': 'ready'})
        elif(order_state == "Delivered"):
            sale_order.write({'state': 'delivered'})
            for invoice in sale_order.invoice_ids:
                invoice.action_invoice_open()
            for picking in sale_order.picking_ids:
                if(picking.state != "cancel"):
                    picking.action_done()
        else:
            sale_order.write({'state': 'payment'})

        return True

    @api.multi
    def get_invoice_details(self, order_id):
        sale_order = self.env['sale.order'].sudo().search([
            ('id', '=', int(order_id))])
        account_journal = self.env['account.journal'].sudo().search([
            ('type', 'in', ['bank', 'cash'])])
        journals = []
        payment_amount = 0
        date_format = '%Y-%m-%d'
        payment_date = (datetime.today()).strftime(date_format)
        invoice_id = 0
        for journal in account_journal:
            journals.append({'id': journal.id,
                             'name': journal.name})
        for invoice in sale_order.invoice_ids:
            payment_amount += invoice.residual
            invoice_id = invoice.id
        datas = [{'journals': journals,
                  'payment_amount': payment_amount,
                  'payment_date': payment_date,
                  'invoice_id': invoice_id,
                  'order_id': sale_order.id}]
        return datas

    @api.multi
    def create_payment(self, journal_id, invoice_id, order_id):
        sale_order = self.env['sale.order'].sudo().search([
            ('id', '=', int(order_id))])
        journal = self.env['account.journal'].sudo().search([
            ('id', '=', int(journal_id))])
        invoice = self.env['account.invoice'].sudo().search([
            ('id', '=', int(invoice_id))])

        invoice_ids = int(invoice_id)
        date_format = '%Y-%m-%d'
        payment_date = (datetime.today()).strftime(date_format)
        payment_val = {'payment_method_id': journal.inbound_payment_method_ids.id,
                       'invoice_ids': [(6, 0, [invoice_ids])],
                       'journal_id': journal.id,
                       'amount': invoice.residual,
                       'payment_date': payment_date,
                       'communication': invoice.number,
                       'payment_type': 'inbound',
                       'partner_type': 'customer',
                       'account_id': invoice.account_id.id,
                       'currency_id': invoice.currency_id.id,
                       'partner_id': invoice.partner_id.id
                       }
        payment = self.env['account.payment'].create(payment_val)
        payment.post()
        sale_order.write({'state': 'payment'})
        return True
