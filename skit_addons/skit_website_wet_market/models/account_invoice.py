# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _


class AccountInvoice(models.Model):
    _inherit = 'account.invoice'

    @api.multi
    def action_invoice_paid(self):
        res = super(AccountInvoice, self).action_invoice_paid()
        for invoice in self:
            sale_order = self.env['sale.order'].sudo().search([('name', '=', invoice.origin)])
            sale_order.update({'state': 'payment'})
        return res
