# -*- coding: utf-8 -*-

from odoo import fields, models, api


class SaleOrder(models.Model):
    _inherit = 'sale.order'
    _description = "Sales Order"

    amount_discount = fields.Monetary(string="Discount", store=True,
                                      readonly=True,
                                      compute='_amount_all')

    @api.depends('order_line.price_total')
    def _amount_all(self):
        """
        Compute the total amounts of the SO.
        """
        for order in self:
            amount_untaxed = amount_tax = 0.0
            amount_discount = 0.0
            for line in order.order_line:
                amount_untaxed += line.price_subtotal
                # FORWARDPORT UP TO 10.0
                if order.company_id.tax_calculation_rounding_method == 'round_globally':
                    price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
                    taxes = line.tax_id.compute_all(price, line.order_id.currency_id, line.product_uom_qty, product=line.product_id, partner=order.partner_shipping_id)
                    amount_tax += sum(t.get('amount', 0.0) for t in taxes.get('taxes', []))
                else:
                    amount_tax += line.price_tax
                amount_discount += ((line.product_uom_qty * line.price_unit))
            order.amount_discount = amount_discount - amount_untaxed
            order.update({
                'amount_untaxed': order.pricelist_id.currency_id.round(amount_untaxed),
                'amount_tax': order.pricelist_id.currency_id.round(amount_tax),
                'amount_total': amount_untaxed + amount_tax,
            })


class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'
    _description = "Sales Order line inherited"

    step_discount = fields.Many2many('skit.step.discount',
                                     string="Step Discount")

    @api.depends('product_uom_qty', 'discount', 'price_unit', 'tax_id',
                 'step_discount')
    def _compute_amount(self):
        """
        Compute the amounts of the SO line.
        """
        for line in self:
            price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
            if line.step_discount:
                taxes = line.tax_id.skit_compute_all(line.price_unit,
                                                     line.step_discount,
                                                     line.order_id.currency_id,
                                                     line.product_uom_qty,
                                                     product=line.product_id,
                                                     partner=line.order_id.partner_id)
            else:
                taxes = line.tax_id.compute_all(price,
                                                line.order_id.currency_id,
                                                line.product_uom_qty,
                                                product=line.product_id,
                                                partner=line.order_id.partner_shipping_id)
            line.update({
                'price_tax': taxes['total_included'] - taxes['total_excluded'],
                'price_total': taxes['total_included'],
                'price_subtotal': taxes['total_excluded'],
            })

    @api.multi
    def _prepare_invoice_line(self, qty):
        """ Prepare invoice line from so line qty
            Pass the step_discount value to invoice line.
            To apply discount in invoice.
            @param  qty: qty of so line.

        """
        res = super(SaleOrderLine, self)._prepare_invoice_line(qty)
        res['step_discount'] = [(6, 0, self.step_discount.ids)]
        return res
