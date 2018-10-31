# -*- coding: utf-8 -*-
from odoo import models, fields, api


class PosOrder(models.Model):
    _inherit = "pos.order"

    @api.model
    def _process_order(self, pos_order):
        """
            _process_order
            create pos order and orderline.
            update the step discount in pos order line 
            to calculate the actual price of line after discount applied for it.
            @param pos_order: array of order data from POS
            @return: pos order
        """
        order = super(PosOrder, self)._process_order(pos_order)
        step_discounts = []
        if pos_order.get('step_discount_arr'):
            step_discounts = [disc.get('id')
                              for disc in pos_order.get('step_discount_arr')
                              ]
            for line in order.lines:
                if 'Step Discount' not in line.product_id.name:
                    line.update({
                                'step_discount_line': [(6, 0, step_discounts)]
                                })

        return order

    def _action_create_invoice_line(self, line=False, invoice_id=False):
        """ Inherited the method to update the skit_step_discount. """
        if 'Step Discount' not in line.product_id.name:
            InvoiceLine = self.env['account.invoice.line']
            inv_name = line.product_id.name_get()[0][1]
            inv_line = {
                'invoice_id': invoice_id,
                'product_id': line.product_id.id,
                'quantity': line.qty,
                'account_analytic_id': self._prepare_analytic_account(line),
                'name': inv_name,
            }
            # Oldlin trick
            invoice_line = InvoiceLine.sudo().new(inv_line)
            invoice_line._onchange_product_id()
            invoice_line.invoice_line_tax_ids = invoice_line.invoice_line_tax_ids.filtered(lambda t: t.company_id.id == line.order_id.company_id.id).ids
            fiscal_position_id = line.order_id.fiscal_position_id
            if fiscal_position_id:
                invoice_line.invoice_line_tax_ids = fiscal_position_id.map_tax(invoice_line.invoice_line_tax_ids, line.product_id, line.order_id.partner_id)
            invoice_line.invoice_line_tax_ids = invoice_line.invoice_line_tax_ids.ids
            # We convert a new id object back to a dictionary to write to
            # bridge between old and new api
            inv_line = invoice_line._convert_to_write({name: invoice_line[name] for name in invoice_line._cache})
            inv_line.update(price_unit=line.price_unit, discount=line.discount)
            # if invoice has step discount applied then, update the step_discount in invoice line.
            if line.step_discount_line:
                inv_line.update(step_discount = [(6, 0, line.step_discount_line.ids)])
            return InvoiceLine.sudo().create(inv_line)

    @api.model
    def _amount_line_tax(self, line, fiscal_position_id):
        """ method to calculate the tax amount """
        taxes = line.tax_ids.filtered(lambda t: t.company_id.id == line.order_id.company_id.id)
        if fiscal_position_id:
            taxes = fiscal_position_id.map_tax(taxes, line.product_id, line.order_id.partner_id)
        price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
        if line.step_discount_line:
            taxes = taxes.skit_compute_all(price,
                                           line.step_discount_line,
                                           line.order_id.pricelist_id.currency_id,
                                           line.qty, product=line.product_id,
                                           partner=line.order_id.partner_id or False)['taxes']
        else:
            taxes = taxes.compute_all(price,
                                      line.order_id.pricelist_id.currency_id,
                                      line.qty, product=line.product_id,
                                      partner=line.order_id.partner_id or False)['taxes']
        return sum(tax.get('amount', 0.0) for tax in taxes)

    @api.depends('statement_ids', 'lines.price_subtotal_incl', 'lines.discount')
    def _compute_amount_all(self):        
        for order in self:
            order.amount_paid = order.amount_return = order.amount_tax = 0.0
            currency = order.pricelist_id.currency_id
            order.amount_paid = sum(payment.amount for payment in order.statement_ids)
            order.amount_return = sum(payment.amount < 0 and payment.amount or 0 for payment in order.statement_ids)
            order.amount_tax = currency.round(sum(self._amount_line_tax(line, order.fiscal_position_id) for line in order.lines))
            amount_untaxed = currency.round(sum(line.price_subtotal for line in order.lines if 'Step Discount' not in line.product_id.name))
            order.amount_total = order.amount_tax + amount_untaxed


class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    step_discount_line = fields.Many2many(
            'skit.step.discount',
            string='Step Discount')

    actual_price = fields.Float(compute='_compute_amount_line_all',
                                digits=0,
                                string='Actual Price')

    @api.depends('price_unit', 'tax_ids', 'qty', 'discount', 'product_id')
    def _compute_amount_line_all(self):
        for line in self:
            fpos = line.order_id.fiscal_position_id
            tax_ids_after_fiscal_position = fpos.map_tax(line.tax_ids, line.product_id, line.order_id.partner_id) if fpos else line.tax_ids
            tax_ids_after_fp = tax_ids_after_fiscal_position
            price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
            if line.step_discount_line and 'Step Discount' not in line.product_id.name:
                taxes = tax_ids_after_fp.skit_compute_all(price,
                                                          line.step_discount_line,
                                                          line.order_id.pricelist_id.currency_id,
                                                          line.qty, product=line.product_id, 
                                                          partner=line.order_id.partner_id)
            else:
                taxes = tax_ids_after_fp.compute_all(price,
                                                     line.order_id.pricelist_id.currency_id,
                                                     line.qty, product=line.product_id,
                                                     partner=line.order_id.partner_id)
            actual_price = (line.price_unit * line.qty)
            line.update({
                'price_subtotal_incl': taxes['total_included'],
                'price_subtotal': taxes['total_excluded'],
                'actual_price': actual_price,
            })

