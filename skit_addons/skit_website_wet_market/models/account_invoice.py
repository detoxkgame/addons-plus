# -*- coding: utf-8 -*-

from odoo import api, models


class AccountInvoice(models.Model):
    _inherit = 'account.invoice'

    @api.multi
    def action_invoice_paid(self):
        res = super(AccountInvoice, self).action_invoice_paid()
        for invoice in self:
            sale_order = self.env['sale.order'].sudo().search([
                ('name', '=', invoice.origin)])
            sale_order.update({'state': 'payment'})
        return res
