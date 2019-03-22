# -*- coding: utf-8 -*-


from odoo import api, fields, models

class AccountingReport(models.TransientModel):
    
    _inherit = "accounting.report"
    filter_analytic_account_ids = fields.Many2many('account.analytic.account', string='Analytic Account', groups="analytic.group_analytic_accounting")

    def _build_contexts(self, data):
        result = super(AccountingReport,self)._build_contexts(data)
        result['filter_analytic_account_ids'] = 'filter_analytic_account_ids' in data['form'] and data['form']['filter_analytic_account_ids'] or False
        return result
    
    def _print_report(self, data):
        data['form'].update(self.read(['filter_analytic_account_ids'])[0])
        used_context = self._build_contexts(data)
        data['form']['used_context'].update(dict(used_context, lang=self.env.context.get('lang', 'en_US')))       
        return super(AccountingReport,self)._print_report(data)
     
 
class AccountMoveLine(models.Model):
    _inherit = "account.move.line"

    @api.model
    def _query_get(self, domain=None):
        domain = domain or []
        context = dict(self._context or {})
        if context.get('filter_analytic_account_ids'):
            domain += [('analytic_account_id', 'in', context['filter_analytic_account_ids'])]
        tables, where_clause, where_params = super(AccountMoveLine,self)._query_get(domain)
        return tables, where_clause, where_params
    
class ReportFinancial(models.AbstractModel):
    _inherit = 'report.skit_account_reports.report_financial'
    
    @api.model
    def _get_report_values(self, docids, data=None):
        result = super(ReportFinancial,self)._get_report_values(docids, data)
        analytic = []
        if data['form'].get('filter_analytic_account_ids', False):
            analytic = [account.name for account in self.env['account.analytic.account'].search([('id', 'in', data['form']['filter_analytic_account_ids'])])]
        result.update({"print_analytic":analytic})
        return result
     
