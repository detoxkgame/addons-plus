# -*- coding: utf-'8' "-*-"
from odoo import api, fields, models


class account_payment(models.Model):
    _inherit = 'account.payment'

    state = fields.Selection([('draft', 'Draft'),
                              ('posted', 'Posted'),
                              ('sent', 'Sent'),
                              ('reconciled', 'Reconciled'),
                              ('void', 'Voided')],
                             readonly=True, default='draft',
                             copy=False, string="Status")

    @api.multi
    def cancel_payment(self):
        """ CancelPayment after unreconciled payment
            set state as void to cancel the payment
            and change the debit and credit value in journal items."""
        for rec in self:
            for move in rec.move_line_ids.mapped('move_id'):
                if rec.invoice_ids or rec.move_line_ids:
                    for move_line in move.line_ids.with_context(
                                        check_move_validity=False):
                        # move reconcile to unreconcile entries
                        move_line.remove_move_reconcile()
                        move.button_cancel()
                        # update debit and credit value as 0 in move line
                        move_line.write({
                                        'debit': 0.0,
                                        'credit': 0.0,
                                        })
                # update state in journal entries
                move.write({
                            'state': 'voided',
                            })
                rec.state = 'void'
