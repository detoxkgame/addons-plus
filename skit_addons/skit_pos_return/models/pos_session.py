from odoo import api, models, _
from odoo.exceptions import UserError


class Skit_PosSession(models.Model):
    _inherit = 'pos.session'

    @api.multi
    def action_pos_session_close(self):
        """ Inherited to void the payment of the cancelled
        invoice order while session close."""
        # Close CashBox
        res = super(Skit_PosSession, self).action_pos_session_close()
        # To voided the Payments
        account_bank_statement_line = self.env['account.bank.statement.line'].search(
            [('statement_id', 'in', self.statement_ids.ids)]
        )
        for line in account_bank_statement_line:
            pos_order_id = line.pos_statement_id.id
            pos_order = self.env['pos.order'].search(
                [('id', '=', pos_order_id)]
            )
            if pos_order.invoice_id.state == 'cancel':
                payment_acc_move_line = self.env['account.move.line'].search(
                    [('statement_line_id', '=', line.id)], limit=1)
                account_payment = payment_acc_move_line.payment_id
                account_payment.cancel_payment()
        return res