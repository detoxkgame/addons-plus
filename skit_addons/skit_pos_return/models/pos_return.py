# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
import odoo.addons.decimal_precision as dp
from odoo.tools import float_is_zero
from odoo.exceptions import UserError


class PosOrder(models.Model):
    _inherit = 'pos.order'
    _description = "Get POS Order Details"

    is_refund = fields.Boolean(string='Return')
    is_exchange = fields.Boolean(string='Exchange')
    
    @api.model
    def _process_order(self, pos_order):
        order = super(PosOrder, self)._process_order(pos_order)
        
        journal_id = 0
        for payments in pos_order['statement_ids']:
            journal_ids = set()
            journal_id = journal_ids.add(payments[2]['journal_id'])
            print (journal_id)
            
        if pos_order['amount_total'] < 0 and journal_id == 0:
                pos_session = self.env['pos.session'].browse(pos_order['pos_session_id'])
                if pos_session.state == 'closing_control' or pos_session.state == 'closed':
                    pos_order['pos_session_id'] = self._get_valid_session(pos_order).id
                cash_journal_id = pos_session.cash_journal_id.id
                if not cash_journal_id:
                        # Select for change one of the cash journals used in this
                        # payment
                    cash_journal = self.env['account.journal'].search([
                        ('type', '=', 'cash'),
                        ('id', 'in', list(journal_ids)),
                    ], limit=1)
                    if not cash_journal:
                            # If none, select for change one of the cash journals of the POS
                            # This is used for example when a customer pays by credit card
                            # an amount higher than total amount of the order and gets cash back
                        cash_journal = [statement.journal_id for statement in pos_session.statement_ids if statement.journal_id.type == 'cash']
                        if not cash_journal:
                            raise UserError(_("No cash statement found for this session. Unable to record returned cash."))
                    cash_journal_id = cash_journal[0].id
                    print (journal_id)
                
                order.add_payment({
                            'amount': pos_order['amount_total'],
                            'payment_date': fields.Date.context_today(self),
                            'payment_name': _('return'),
                            'journal': cash_journal_id,
                    })
        return order
    

    def get_order_details(self, barcode_no):
        pos_order = self.search([('pos_reference', '=',  barcode_no)])
        state = pos_order.invoice_id.state
        lines = []
        if ((pos_order.invoice_id.state != 'open') and (pos_order.invoice_id.state != 'cancel')):
            for line in pos_order.lines:
                val = []
                if(line.pack_lot_ids):
                    for att in line.pack_lot_ids:
                        vals = {'lot_name': att.lot_name,
                                'pos_order_line_id': att.pos_order_line_id.id,
                                'pack_lot_id': att.id
                                }
                        val.append([0, 0, vals])
                quantity = line.qty
                if line.return_qty:
                    quantity = line.qty - line.return_qty
                if line.product_id.returnable:
                    lines.append({'product_id': line.product_id.id,
                                  'product_name': line.product_id.name,
                                  'pack_lot_ids': val,
                                  'quantity': quantity,
                                  'order_id': line.order_id.id,
                                  'id': line.id,
                                  'price': line.price_unit,
                                  'partner': line.order_id.partner_id.id,
                                  'is_refund': line.order_id.is_refund,
                                  'is_exchange': line.order_id.is_exchange,
#                                   'reason_for_return': line.reason,
                                  'discount': line.discount,
                                  'returnable': line.product_id.returnable,
                                  'date_order': line.order_id.date_order,
                                  'return_days': line.product_id.return_days,
                                  'categ_return_days': line.product_id.categ_id.categ_return_days,
                                  'taxes_id': line.product_id.taxes_id.amount,
                                  })
                    #return lines
        return {'lines': lines, 'state': state}

    def get_order_no(self, order):
        pos_order = self.search([('pos_reference', '=', order)])

        for order in pos_order:
            return order.name

    @api.model
    def _order_fields(self, ui_order):
        order_fields = super(PosOrder, self)._order_fields(ui_order)
        order_fields['is_refund'] = ui_order.get('is_refund')
        order_fields['is_exchange'] = ui_order.get('is_exchange')
        return order_fields

    def _prepare_invoice(self):
        """
        Prepare the dict of values to create the new invoice for a pos order.
        """
        res = super(PosOrder, self)._prepare_invoice()
        invoice_type = 'out_invoice' if self.amount_total>=0 else 'out_refund'
       
        return {
            'name': self.name,
            'origin': self.name,
            'account_id': self.partner_id.property_account_receivable_id.id,
            'journal_id': self.session_id.config_id.invoice_journal_id.id,
            'company_id': self.company_id.id,
            'type': invoice_type,
            'reference': self.name,
            'partner_id': self.partner_id.id,
            'comment': self.note or '',
            # considering partner's sale pricelist's currency
            'currency_id': self.pricelist_id.currency_id.id,
            'user_id': self.env.uid,
        }

    def _action_create_invoice_line(self, line=False, invoice_id=False):
        """ Inherited the method to update the invoice -
                                    Reference/Description field. """
        invoice_line = super(PosOrder, self)._action_create_invoice_line(line, invoice_id)
        if invoice_id:
            if line.refund_line_id:
                invoice_line.update({
                    'quantity': line.qty if self.amount_total >= 0 else -line.qty,
                    })
                invoice_line.invoice_id.update({
                    'name':  line.refund_line_id.order_id.name,
                    })


class pos_order_line(models.Model):
    _inherit = 'pos.order.line'

    refund_line_id = fields.Many2one(
                    'pos.order.line',
                    string='Refund Order Line',
                    ondelete='cascade'
    )
    return_qty = fields.Float(string='Returns',
                              compute='_compute_retun_qty',
                              digits=dp.get_precision('Product Unit of Measure'))
    reason_for_return = fields.Text(string='Reason For Return')

#     @api.depends('product_id')
#     def _compute_retun_qty(self):
#         for line in self:
#             retun_ids = self.search([('refund_line_id', '=', line.id)])
#             if len(retun_ids) > 0:
#                 rqty = sum(x.qty for x in retun_ids)
#                 line.return_qty = abs(rqty)

    @api.depends('product_id')
    def _compute_retun_qty(self):
        for line in self:
            retun_ids = self.search([('refund_line_id', '=', line.id)])
            rqty = 0
            for am in retun_ids:
                price_amount = am.price_unit
                if ((len(retun_ids) > 0) & (price_amount != 0)):
                    rqty = rqty + am.qty
            line.return_qty = abs(rqty)


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    returnable = fields.Boolean(
            string='Returnable',
            help='Check if product is returnable',
            default=False
    )
    return_days = fields.Char(
            'Days of return',
            help="Return Order from specified number of days")


class ProductCategory(models.Model):
    _inherit = 'product.category'

    categ_return_days = fields.Char(
            'Return Days',
            help="Return Order from specified number of days")

class AccountInvoice(models.Model):
    _inherit = "account.invoice"
    
    @api.multi
    def action_invoice_open(self):
        to_open_invoices = self.filtered(lambda inv: inv.state != 'open')
        if to_open_invoices.filtered(lambda inv: not inv.partner_id):
            raise UserError(_("The field Vendor is required, please complete it to validate the Vendor Bill."))
        if to_open_invoices.filtered(lambda inv: inv.state != 'draft'):
            raise UserError(_("Invoice must be in draft state in order to validate it."))
        if to_open_invoices.filtered(lambda inv: not inv.account_id):
            raise UserError(_('No account was found to create the invoice, be sure you have installed a chart of account.'))
        to_open_invoices.action_date_assign()
        to_open_invoices.action_move_create()
        return to_open_invoices.invoice_validate()
    