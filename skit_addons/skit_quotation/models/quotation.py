# -*- coding: utf-8 -*-
from odoo import api, models, fields
from odoo.exceptions import UserError
from datetime import datetime


class Skit_saleorder(models.Model):
    _inherit = 'sale.order'

    @api.model
    def create_quotation_from_ui(self, pos_order):
        """ Create Quotation
            args: orders
        """
        pos_ses = self.env['pos.session'].browse(
                                    pos_order['pos_session_id'])
        if pos_ses.state == 'closing_control' or pos_ses.state == 'closed':
            raise UserError(_("Session was closed."))

        order = self.create({
                    'partner_id': pos_order['partner_id'],
                    'note': 'Created from POS in Session ' + pos_ses.name
                })
        order_details = []
        if order:
            order_line = self.env['sale.order.line']
            for oline in pos_order.get('lines'):
                line = oline[2]
                line_vals = {
                     'order_id': order.id,
                     'price_unit': line['price_unit'],
                     'product_id': line['product_id'],
                     'product_uom_qty': line['qty'],
                 }
                order_line.create(line_vals)
            order_details.append({'name': order.name,
                                  'id': order.id
                                  })
            return order_details
        else:
            raise UserError(_('Error in Processing this order.'))

    @api.model
    def fetch_quotation_order(self, session_id):
        """ Serialize the orders from Sales
        """
        # Get last 30days record from sale order
        sql_query = """ select x.order_id, x.date_order, x.type  from(
                        select id as order_id,date_order, 'SO' as type
                        from sale_order
                        where note like '%POS in Session%' and
                        date_order > current_date - interval '30 day'
                        )
                        as x order by x.date_order desc """

        self._cr.execute(sql_query)
        rows = self._cr.dictfetchall()
        so_ids = [x['order_id'] for x in rows if x['type'] == "SO"]
        orders = self.search([('id', 'in', so_ids)])
        order_details = []
        status = ''
        invoice_status = ''
        isno = 0
        for order in orders:
            if order.invoice_ids.state:
                if(order.invoice_ids.state == 'draft'):
                    status = 'Draft'
                elif(order.invoice_ids.state == 'open'):
                    status = 'Open'
                elif(order.invoice_ids.state == 'paid'):
                    status = 'Paid'
                elif(order.invoice_ids.state == 'cancel'):
                    status = 'Cancelled'
            else:
                if(order.state == 'draft'):
                    status = 'Quotation'
                elif(order.state == 'sent'):
                    status = 'QuotationSent'
                elif(order.state == 'sale'):
                    status = 'Sale Order'
                elif(order.state == 'done'):
                    status = 'Locked'
                elif(order.state == 'cancel'):
                    status = 'Cancelled'
            if(order.invoice_status):
                if(order.invoice_status == 'no'):
                    invoice_status = 'Nothing to Invoice'
                elif(order.invoice_status == 'to invoice'):
                    invoice_status = 'To Invoice'
                elif(order.invoice_status == 'invoiced'):
                    invoice_status = 'Fully Invoiced'
            isno = isno + 1
            unpaid_amount = round(order.invoice_ids.residual, 2)
            order_details.append({'name': order.name,
                                  'order_id': order.id,
                                  'sno': isno,
                                  'amount_total': round(order.amount_total, 2),
                                  'date_order': order.date_order,
                                  'partner': order.partner_id.name if order.partner_id else '',
                                  'status': status,
                                  'invoice_id': order.invoice_ids.id,
                                  'invoice_status': invoice_status,
                                  'amount_due': unpaid_amount if unpaid_amount > 0 else '',
                                  })
        return {'order_details': order_details}

    @api.model
    def fetch_quotation_order_line(self, order_id):

        order = self.env['sale.order'].search([('id', '=', order_id)])
        line_vals = []
        isno = 0
        for line in order.order_line:
            isno = isno + 1
            line_vals.append({
                'id': line.id,
                'sno': isno,
                'price_unit': line.price_unit,
                'product': line.product_id.name,
                'product_uom_qty': line.product_uom_qty,
                'amount': line.price_subtotal,
            })
        return line_vals

    @api.model
    def so_order_confirm(self, order_id):
        sale_order = self.env['sale.order'].browse(int(order_id))
        sale_order.state = 'sale'
        sale_order.confirmation_date = fields.Datetime.now()
        sale_order.order_line._action_launch_stock_rule()
        return True

    @api.model
    def create_invoices(self, order_id):

        sale_order = self.env['sale.order'].browse(int(order_id))
        sale_order.action_invoice_create()
        for invoice in sale_order.invoice_ids:
            invoice.action_invoice_open()

        return True

    @api.model
    def payment_details(self, order_id):
        sale_order = self.env['sale.order'].browse(int(order_id))
        account_invoice = self.env['account.invoice'].search([
                                        ('origin', '=', sale_order.name)])
        account_journal = self.env['account.journal'].search([
                                        ('type', 'in', ('bank', 'cash'))])
        payment_vals = []
        journals = []
        payment_type = account_invoice.type in ('out_invoice', 'in_refund') and 'inbound' or 'outbound'
        payment_vals.append({
                'id': sale_order.id,
                'payment_type': payment_type,
                'partner_type': 'customer' if payment_type == 'inbound' else 'supplier',
                'account_id': account_invoice.account_id.id,
                'invoice_ids': account_invoice.id,
                'payment_amount': round(account_invoice.residual, 2),
                'payment_date': datetime.today().strftime('%d/%m/%Y'),
                'communication': account_invoice.number,
                'partner_id': account_invoice.partner_id.id,
                'currency_id': account_invoice.currency_id.id,
                'currency_symbol': account_invoice.currency_id.symbol
                })
        for journal in account_journal:
            journals.append({
                'journal_id': journal.id,
                'journal_name': journal.name,
                })
        return {'payment_vals': payment_vals, 'journals': journals}

    @api.model
    def shipment_view(self, order_id):

        shipment_vals = []
        shipment_dropdown = []
        picking_type_vals = []
        status = ""
        if order_id:
            sale_order = self.env['sale.order'].browse(int(order_id))
            stock_picking = self.env['stock.picking'].search([
                                                ('id', 'in',
                                                 sale_order.picking_ids.ids)])
            stock_dropdown = self.env['stock.picking'].search([])
            stock_picking_type = self.env['stock.picking.type'].search([])
            stock_pick_type = self.env['stock.picking.type'].search([
                                            ('id', '=',
                                             stock_picking.picking_type_id.id)
                                            ])
            status = stock_picking.state
            # Shipping policy value
            move_type_value = ''
            if stock_picking.move_type == 'direct':
                move_type_value = 'As soon as possible'
            else:
                move_type_value = 'When all products are ready'
            # Priority value
            priority_value = ''
            if stock_picking.priority == '0':
                priority_value = 'Not urgent'
            elif stock_picking.priority == '1':
                priority_value = 'Normal'
            elif stock_picking.priority == '2':
                priority_value = 'Urgent'
            else:
                priority_value = 'Very Urgent'

            shipment_vals.append({
                'id': sale_order.id,
                'name': stock_picking.name,
                'origin': stock_picking.origin,
                'min_date': stock_picking.scheduled_date,
                'partner': stock_picking.partner_id.name,
                'move_type': stock_picking.move_type,
                'move_type_value': move_type_value,
                'priority_value': priority_value,
                'picking_type': stock_pick_type.warehouse_id.name + stock_pick_type.name if stock_pick_type.warehouse_id else stock_pick_type.name,
                'picking_type_id': stock_picking.picking_type_id.id,
                'group': stock_picking.group_id.name,
                'priority': stock_picking.priority,
            })
            for stock in stock_dropdown:
                shipment_dropdown.append({'move_type': stock.move_type,
                                          'priority': stock.priority})
            for picking in stock_picking_type:
                    if(picking.warehouse_id):
                        picking_type_vals.append({
                                'picking_type_id': picking.id,
                                'picking_type_name': picking.warehouse_id.name + picking.name
                                })
                    else:
                        picking_type_vals.append({
                                        'picking_type_id': picking.id,
                                        'picking_type_name': picking.name
                                        })

        return {'shipment_vals': shipment_vals,
                'shipment_dropdown': shipment_dropdown,
                'picking_type_vals': picking_type_vals,
                'state': status}

    @api.model
    def shipment_operation_lines(self, order_id):
        sale_order = self.env['sale.order'].browse(int(order_id))
        stock_picking = self.env['stock.picking'].search([
                                    ('id', 'in', sale_order.picking_ids.ids)])
        operation_line = stock_picking.move_ids_without_package
        line_vals = []
        for line in operation_line:
            line_vals.append({
                'product': line.product_id.name,
                'qty_done': line.quantity_done,
                'to_do': line.product_uom_qty,
                })
        return line_vals

    @api.model
    def qty_to_validate(self, order_id):
        sale_order = self.env['sale.order'].browse(int(order_id))
        stock_picking = self.env['stock.picking'].search([
                                    ('id', 'in', sale_order.picking_ids.ids)])
        stock_pack_operation = self.env['stock.move'].search([
                                    ('picking_id', 'in', stock_picking.ids)])
        for pack in stock_pack_operation:
            if pack.product_qty > 0:
                pack.write({'quantity_done': pack.product_qty})
        if stock_picking:
            stock_picking.button_validate()
        return True

    @api.model
    def shipment_initial_lines(self, order_id):
        sale_order = self.env['sale.order'].browse(int(order_id))
        stock_picking = self.env['stock.picking'].search([
                                ('id', 'in', sale_order.picking_ids.ids)])
        stock_move = self.env['stock.move'].search([
                                ('picking_id', '=', stock_picking.id)])
        line_vals = []
        for line in stock_move:
            line_vals.append({
                'product': line.product_id.name,
                'qty': line.product_uom_qty,
                'state': line.state,
                })
        return line_vals

    @api.multi
    def update_shipment_details(self, order_id, shipment_vals, ship_vals):
        sale_order = self.env['sale.order'].browse(int(order_id))
        stock_pack_operation = self.env['stock.move'].search([
                                        ('picking_id', 'in',
                                         sale_order.picking_ids.ids)])
        stock_picking = self.env['stock.picking'].search([
                                        ('id', 'in',
                                         sale_order.picking_ids.ids)])
        for shipment in shipment_vals:
            stock_picking.update(shipment)
        for ship in ship_vals:
            stock_pack_operation.update(ship)


class AccountPayment(models.Model):
    _inherit = 'account.payment'

    @api.model
    def create_payment(self, order_id, pay_vals):
        """ Create payment for order """
        journal = self.env['account.journal'].search([
                                    ('id', '=',
                                     pay_vals[0]['journal_id'])])
        pay_vals[0]['payment_method_id'] = journal.inbound_payment_method_ids.id
        invoice_ids = int(pay_vals[0]['invoice_id'])
        pay_vals[0]['invoice_ids'] = [(6, 0, [invoice_ids])]
        pay_vals[0]['currency_id'] = int(pay_vals[0]['currency_id'])
        payment = self.env['account.payment'].create(pay_vals[0])
        payment.post()
        return True

    @api.model
    def change_payment_amount(self, payment_id, changed_amount, amount):
        partial_payment_amount = (float(amount) - float(changed_amount))
        return round(partial_payment_amount, 2)
