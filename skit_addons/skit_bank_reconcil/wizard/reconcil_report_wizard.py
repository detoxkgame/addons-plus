# -*- coding: utf-8 -*-
from odoo import api, models, fields

    
class skit_reconcil_report(models.TransientModel):
    _name = "bank.reconcil.rep"
    
    journal_id = fields.Many2one('account.journal',
                                    domain=[('type', '=', 'bank')],
                                    string='Journal',
                                    help="The accounting journal corresponding to this bank account.")
    @api.multi
    def print_report(self):
        active_ids = self.env.context.get('active_ids', [])
        journal_id = self.journal_id.id
        datas = {
        'ids': active_ids,
        'model': 'account.payment',
        'form': self.read(),
        'journal_id':journal_id,
        'skit_report_type': 'pdf'
        }
        return self.env.ref('skit_bank_reconcil.bank_reconciliation_report').report_action(self, data=datas)

    def _build_contexts(self, data):
        result = {}
        result['journal_id'] = 'journal_id' in data['form'] and data['form']['journal_id'] or False
        return result
     
    



