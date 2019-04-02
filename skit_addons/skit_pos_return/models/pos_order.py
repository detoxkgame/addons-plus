# -*- coding: utf-8 -*-
from odoo import api, models, _
from datetime import datetime
from odoo.exceptions import UserError


class Skit_PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def cancel_invoice(self, pos_order_id):
        """ Allow Canceling Invoices without deleting the invoice number from POS
        Upon Canceling an Invoice, following changes happen:
        1. An Invoice is set to Cancelled state.
        2. The Journal entries for this Invoice is voided.
        3. Set debit and credit value as 0 in journal item
        4. Price unit of Invoice line and Pos order line is set to 0
        5. Payment journal is voided after session close
        """
        pos_order = self.env['pos.order'].search([('id', '=', int(pos_order_id))])
        pos_order_id = pos_order.id
        invoice_id = pos_order.invoice_id.id
        acc_move_id = pos_order.account_move.id
        acc_invoice = self.env['account.invoice'].search(
             [('id', '=', invoice_id)]
        )
        pos_order_line = self.env['pos.order.line'].search(
             [('order_id', '=', pos_order_id)]
        )
        account_invoice_line = self.env['account.invoice.line'].search(
             [('invoice_id', '=', acc_invoice.id)]
        )
        account_move = self.env['account.move'].search(
             [('id', '=', acc_move_id)]
        )
        statement_ids = pos_order.statement_ids.ids
        account_bank_statement_line = self.env['account.bank.statement.line'].search(
             [('id', 'in', statement_ids)]
        )
        try:
            for stmt_line in account_bank_statement_line:
                if not stmt_line.journal_id.update_posted:
                    raise UserError(_('You cannot modify a posted entry of this journal.\nFirst you should set the journal to allow cancelling entries.'))

            if not account_move.journal_id.update_posted:
                raise UserError(_('You cannot modify a posted entry of this journal.\nFirst you should set the journal to allow cancelling entries.'))
            else:
                for order_line in pos_order_line:
                    order_line.write({"price_unit": 0.0})
                for inv_line in account_invoice_line:
                    inv_line.write({"price_unit": 0.0})
                account_move.button_cancel()
                account_move.void()
                acc_invoice.write({"state": 'cancel'})
                pos_order.invoice_cancel = True
        except Exception as e:
            return e.message or e.name
        return True

    @api.model
    def check_allow_cancelling_entry(self, old_journal_id):
        account_journal = self.env['account.journal'].search(
             [('id', '=', old_journal_id)]
        )
        if not account_journal.update_posted:
            return False
        else:
            return True