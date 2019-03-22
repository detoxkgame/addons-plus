# -*- coding: utf-8 -*-

from odoo import api, fields, models

class AccountGeneralLedger(models.TransientModel):
    
    _inherit = "account.report.general.ledger"
    filter_analytic_account_ids = fields.Many2many('account.analytic.account', string='Analytic Account', groups="analytic.group_analytic_accounting")

    def _build_contexts(self, data):
        result = super(AccountGeneralLedger,self)._build_contexts(data)
        result['filter_analytic_account_ids'] = 'filter_analytic_account_ids' in data['form'] and data['form']['filter_analytic_account_ids'] or False
        return result
    
class ReportGL(models.AbstractModel):
    _inherit = 'report.skit_account_reports.report_generalledger'
    
    @api.model
    def _get_report_values(self, docids, data=None):
        result = super(ReportGL,self)._get_report_values(docids, data)
        analytic = []
        if data['form'].get('filter_analytic_account_ids', False):
            analytic = [account.name for account in self.env['account.analytic.account'].search([('id', 'in', data['form']['filter_analytic_account_ids'])])]
        result.update({"print_analytic":analytic})
        return result

class AccountCommonAccountReport(models.TransientModel):
    _inherit = 'account.common.account.report'
    
    @api.multi
    def pre_print_report(self, data):
        result = super(AccountCommonAccountReport,self).pre_print_report(data)
        result['form'].update(self.read(['filter_analytic_account_ids'])[0])
        used_context = self._build_contexts(data)
        result['form']['used_context'].update(dict(used_context, lang=self.env.context.get('lang', 'en_US')))
        return result