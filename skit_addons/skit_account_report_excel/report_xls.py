# -*- coding: utf-8 -*-

from odoo import api,models


class custom_rep(models.TransientModel):
    
    _inherit = "account.report.general.ledger"
    @api.multi
    def check_report_xlsx(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['date_from', 'date_to', 'journal_ids', 'target_move','company_id'])[0]
        used_context = self._build_contexts(data)
        data['form']['used_context'] = dict(used_context, lang=self.env.context.get('lang', 'en_US'))
        data['skit_report_type'] = "XLS"
        data['skit_currency'] = self.env.user.currency_id.symbol
        # report = report_obj._get_report_from_name('module.report_name')
        return self._print_report(data)
        # self.render_xls(data);
custom_rep()

class custom_bal(models.TransientModel):
    
    _inherit = "account.balance.report"
    @api.multi
    def check_report_xlsx(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['date_from', 'date_to', 'journal_ids', 'target_move','company_id'])[0]
        used_context = self._build_contexts(data)
        data['form']['used_context'] = dict(used_context, lang=self.env.context.get('lang', 'en_US'))
        data['skit_report_type'] = "XLS"
        data['skit_currency'] = self.env.user.currency_id.symbol
        # report = report_obj._get_report_from_name('module.report_name')
        return self._print_report(data)
        # self.render_xls(data);

 
custom_bal()

class custom_account(models.TransientModel):
    
    _inherit = "accounting.report"
    @api.multi
    def check_report_xlsx(self):
        res = super(custom_account, self).check_report()
        res['data']['skit_report_type'] = "XLS"        
        res['data']['skit_currency'] = self.env.user.currency_id.symbol 
        return res


custom_account()

class custom_aged(models.TransientModel):

    _inherit = "account.aged.trial.balance"
    @api.multi
    def check_report_xlsx(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['date_from', 'date_to', 'journal_ids', 'target_move','company_id'])[0]
        used_context = self._build_contexts(data)
        data['form']['used_context'] = dict(used_context, lang=self.env.context.get('lang', 'en_US'))
        data['skit_report_type'] = "XLS"
        data['skit_currency'] = self.env.user.currency_id.symbol
        # report = report_obj._get_report_from_name('module.report_name')
        return self._print_report(data)
        # self.render_xls(data);

custom_aged()

class custom_patner(models.TransientModel):

    _inherit = "account.report.partner.ledger"
    @api.multi
    def check_report_xlsx(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['date_from', 'date_to', 'journal_ids', 'target_move','company_id'])[0]
        used_context = self._build_contexts(data)
        data['form']['used_context'] = dict(used_context, lang=self.env.context.get('lang', 'en_US'))
        data['skit_report_type'] = "XLS"
        data['skit_currency'] = self.env.user.currency_id.symbol
        # report = report_obj._get_report_from_name('module.report_name')
        return self._print_report(data)
        # self.render_xls(data);

custom_patner()

class custom_tax(models.TransientModel):

    _inherit = "account.tax.report"
    @api.multi
    def check_report_xlsx(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['date_from', 'date_to', 'journal_ids', 'target_move','company_id'])[0]
        used_context = self._build_contexts(data)
        data['form']['used_context'] = dict(used_context, lang=self.env.context.get('lang', 'en_US'))
        data['skit_report_type'] = "XLS"
        data['skit_currency'] = self.env.user.currency_id.symbol
        # report = report_obj._get_report_from_name('module.report_name')
        return self._print_report(data)
        # self.render_xls(data);

custom_tax()

class custom_audit(models.TransientModel):

    _inherit = "account.print.journal"
    @api.multi
    def check_report_xlsx(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['date_from', 'date_to', 'journal_ids', 'target_move','company_id'])[0]
        used_context = self._build_contexts(data)
        data['form']['used_context'] = dict(used_context, lang=self.env.context.get('lang', 'en_US'))
        data['skit_report_type'] = "XLS"
        data['skit_currency'] = self.env.user.currency_id.symbol
        # report = report_obj._get_report_from_name('module.report_name')
        return self._print_report(data)
        # self.render_xls(data);

custom_audit()

