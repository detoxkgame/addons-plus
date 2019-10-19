# -*- coding: utf-8 -*-

from odoo import fields, models, api
from odoo.exceptions import UserError


class AccountPartnerLedger(models.TransientModel):
    _inherit = "account.common.partner.report"
    _name = "account.report.partner.ledger"
    _description = "Account Partner Ledger"

    amount_currency = fields.Boolean("With Currency", help="It adds the currency column on report if the currency differs from the company currency.")
    reconciled = fields.Boolean('Reconciled Entries')
    partner_id = fields.Many2one('res.partner', string='Partner')

    def _print_report(self, data):
        data = self.pre_print_report(data)
        data['form'].update({'reconciled': self.reconciled, 'amount_currency': self.amount_currency,'partner_id':self.partner_id.id})       
        return self.env.ref('skit_account_reports.action_report_partnerledger').with_context(landscape=True).report_action(self, data=data)
    
      
    @api.onchange('result_selection')
    def _display_partners(self):
        if (self.result_selection == 'customer'):
            partner_ids = self.env['res.partner'].search([('customer', '=', True)]).ids
            return {'domain': {'partner_id': [('id', 'in', partner_ids)]}}
        elif (self.result_selection == 'supplier'):
            partner_ids = self.env['res.partner'].search([('supplier', '=', True)]).ids
            return {'domain': {'partner_id': [('id', 'in', partner_ids)]}}
        else:
            return {'domain': {'partner_id': []}}