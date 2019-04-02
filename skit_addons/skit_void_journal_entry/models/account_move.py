# -*- coding: utf-8 -*-

from odoo import models, api, fields


class AccountMove(models.Model):
    """ Inherited account move """
    _inherit = "account.move"
    _description = 'Journal Entries'

    # inherited state field to add voided option in selection
    state = fields.Selection(selection_add=[('voided', 'Voided')],
                             string='Status',
                             required=True, readonly=True,
                             copy=False, default='draft',
                             help='All manually created new journal entries '
                             'are usually in the status \'Unposted\', '
                             'but you can set the option to skip that status '
                             'on the related journal. '
                             'In that case, they will behave as journal '
                             'entries automatically created by the '
                             'system on document validation (invoices, bank '
                             'statements...) and will be created '
                             'in \'Posted\' status.')

    @api.multi
    def void(self):
        """ Change state to voided and
            update debit and credit amount value as 0 in move line
        """
        # get move line is
        for move_line in self.line_ids.with_context(check_move_validity=False):
            # move reconcile to unreconcile entries
            move_line.remove_move_reconcile()
            # update debit and credit value as 0 in move line
            move_line.write({
                              'debit': 0.0,
                              'credit': 0.0,
                              })
        return self.write({'state': 'voided'})
