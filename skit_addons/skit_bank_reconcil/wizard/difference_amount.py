# -*- coding: utf-8 -*-
from odoo import api, models, fields, _


class account_journal(models.Model):
    _inherit = 'account.journal'
        
        
    @api.multi
    def print_report(self):
        
        return {
            'type': 'ir.actions.act_window',
            'view_type': 'form',
            'view_mode': 'form',
            'res_model': 'bank.reconcil.rep',
            'view_id': self.env.ref('skit_bank_reconcil.view_bank_reconciliation_diff').id,
            'context': {'default_journal_id': self.id,
                        },
            'create': False,
            'target': 'new',
        }
        
         
