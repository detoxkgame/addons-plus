# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from odoo import SUPERUSER_ID
from odoo.exceptions import UserError


class pos_session(models.Model):
    _inherit = 'pos.session'

    @api.multi
    def get_pos_session(self, session_id):
        """ Display opened Session for logged user with Cash Register balance

        :param session_id: POS Open Session id .

        :return: Array of POS Session records.
        """
        if session_id:
            session = self.browse(int(session_id))
        if session:
            if session.user_id.has_group('point_of_sale.group_pos_manager'):
                admin = 1
            else:
                admin = 0
            pos_session = {"id": session.id,
                           "name": session.name,
                           "user_id": [session.user_id.id,
                                       session.user_id.name],
                           "cash_control": session.cash_control,
                           "state": session.state,
                           "stop_at": session.stop_at,
                           "config_id": [session.config_id.id,
                                         session.config_id.display_name],
                           "start_at": session.start_at,
                           "currency_id": [session.currency_id.id,
                                           session.currency_id.name],
                           "cash_register_balance_end_real": (
                                session.cash_register_balance_end_real),
                           "cash_register_total_entry_encoding": (
                                session.cash_register_total_entry_encoding),
                           "cash_register_difference": (
                                session.cash_register_difference),
                           "cash_register_balance_start": (
                                session.cash_register_balance_start),
                           "cash_register_balance_end": (
                                session.cash_register_balance_end),
                           "is_admin": (admin),
                           "rooms_available": session.rooms_available,
                           "rooms_reserved": session.rooms_reserved,
                           "rooms_occupied": session.rooms_occupied,
                           "rooms_blocked": session.rooms_blocked,
                           "hand_over_to": session.hand_over_to.name,
                           }
            return pos_session
        else:
            return

    @api.multi
    def get_cashbox(self, session_id, balance):
        """ Display Set Closing Balance Records for logged session

        :param session_id: POS Open Session id .

        :return: Array of cashbox line.
        """
        is_delete = True
        access_model = self.env['ir.model.access'].sudo().search(
            [('name', 'ilike', 'account.cashbox.line user')]
        )
        # Hide Delete icon in POS Closing Balance popup if Technical Settings/Show Full Accounting Features and
        # Delete Access options are not checked.
        if not self.user_has_groups('account.group_account_user') and not access_model.perm_unlink:
            is_delete = False
        session = self.browse(int(session_id))
        session.ensure_one()
        context = dict(session._context)
        balance_type = balance or 'end'
        context['bank_statement_id'] = session.cash_register_id.id
        context['balance'] = balance_type
        context['default_pos_id'] = session.config_id.id
        cashbox_id = None
        if balance_type == 'start':
            cashbox_id = session.cash_register_id.cashbox_start_id.id
        else:
            cashbox_id = session.cash_register_id.cashbox_end_id.id
        cashbox_line = []
        total = 0
        if cashbox_id:
            account_cashbox_line = self.env['account.cashbox.line']
            cashbox = account_cashbox_line.search([
                         ('cashbox_id', '=', cashbox_id)
                      ])
            if cashbox:
                for line in cashbox:
                    subtotal = line.number * line.coin_value
                    total += subtotal
                    cashbox_line.append({"id": line.id,
                                         "number": line.number,
                                         "coin_value": line.coin_value,
                                         "subtotal": subtotal,
                                         "total": total,
                                         "is_delete": is_delete
                                         })
            else:
                cashbox_line.append({"total": total,
                                     "is_delete": is_delete
                                     })
        else:
            cashbox_line.append({"total": total,
                                 "is_delete": is_delete
                                 })
        return cashbox_line

    @api.multi
    def get_room_details(self, session_id):
        """ Get room details data

        :param session_id: POS Open Session id .

        :return: Array of values required for room screen.
        """
        checkin_val = []
        checkout_val = []

        session = self.browse(int(session_id))
        pos_order = self.env['pos.order'].sudo().search(
            [('session_id', '=', session.id)]
        )
        room_status = {"rooms_available": session.rooms_available,
                       "rooms_reserved": session.rooms_reserved,
                       "rooms_occupied": session.rooms_occupied,
                       "rooms_blocked": session.rooms_blocked}
        for order in pos_order:
            product_history = self.env['product.history'].sudo().search(
                [('order_id', '=', order.id),
                 ('product_id.categ_id.is_room', '=', True),
                 ('state', 'in', ('checkin', 'checkout'))
                 ])
            for history in product_history:
                journal_names = ''
                if history.order_id.statement_ids:
                    for statement_line in history.order_id.statement_ids:
                        if journal_names:
                            journal_names = journal_names+', '+statement_line.journal_id.name
                        else:
                            journal_names = statement_line.journal_id.name
                val = {
                     "partner_name": history.order_id.partner_id.name,
                     'product_name': history.product_id.name,
                     'price_subtotal': history.order_id.amount_total,
                     'checkin_date': history.date.time(),
                     'journal_id': journal_names,
                     'payment': history.order_id.invoice_id.state or 'No Invoice'
                }
                if history.state == 'checkin':
                    checkin_val.append(val)
                elif history.state == 'checkout':
                    checkout_val.append(val)
        room_details = {"checkin_val": checkin_val,
                        "checkout_val": checkout_val,
                        "room_status": room_status}
        return room_details

    @api.multi
    def get_service_details(self, session_id):
        """ Get service details data

        :param session_id: POS Open Session id .

        :return: Array of values required for service screen.
        """
        service_val = []
        session = self.browse(int(session_id))
        service_order = self.env['pos.order'].sudo().search(
            [('session_id', '=', session.id),
             ('is_room_service', '=', True)
             ]
        )
        for s_order in service_order:
            time = str(s_order.date_order.hour)+':'+str(s_order.date_order.minute)
            pos_order_line = self.env['pos.order.line'].sudo().search([
                ('order_id', '=', s_order.id)
            ])
            source_folio_order = s_order.source_folio_id
            source_order_line = self.env['pos.order.line'].sudo().search([
                ('order_id', '=', source_folio_order.id)
            ])
            invoice_state = s_order.invoice_id.state
            for line in pos_order_line:
                val = {
                    "category_name": line.product_id.categ_id.name,
                    "product_name": source_order_line.product_id.name,
                    "partner_name": s_order.partner_id.name,
                    'time': time,
                    'user_name': session.user_id.name,
                    'order_state': s_order.state,
                    'invoice_state': invoice_state,
                }
                service_val.append(val)
        service_details = {"service_val": service_val}
        return service_details

    @api.multi
    def get_purchase_details(self, session_id):
        """ Get purchase details data

        :param session_id: POS Open Session id .

        :return: Array of values required for purchase screen.
        """
        purchase_val = []
        session = self.browse(int(session_id))
        purchase_order = self.env['purchase.order'].sudo().search(
            [('session_id', '=', session.id)]
        )
        for p_order in purchase_order:
            time = str(p_order.date_order.hour)+':'+str(p_order.date_order.minute)
            invoice_state = p_order.invoice_status
            purchase_order_line = self.env['purchase.order.line'].sudo().search(
                                                [('order_id', '=', p_order.id)]
                                                        )
            for line in purchase_order_line:
                val = {
                    "category_name": line.product_id.categ_id.name,
                    "qty": line.product_qty,
                    "product_name": line.product_id.name,
                    "partner_name": p_order.partner_id.name,
                    'time': time,
                    'price_total': line.price_total,
                    'invoice_state': invoice_state or '',
                }
                purchase_val.append(val)
        purchase_details = {"purchase_val": purchase_val}
        return purchase_details


class AccountBankStmtCashWizard(models.Model):
    """
    Account Bank Statement popup that allows entering cash details.
    """
    _inherit = 'account.bank.statement.cashbox'
    _description = 'Account Bank Statement Cashbox Details'

    description = fields.Char("Description")

    @api.model
    def create(self, vals):
        line = super(AccountBankStmtCashWizard, self).create(vals)
        return line

    @api.multi
    def validate_from_ui(self, session_id, balance, values):
        """ Create , Edit , Delete of Closing Balance Grid

        :param session_id: POS Open Session id .
        :param values: Array records to save

        :return: Array of cashbox line.
        """
        session = self.env['pos.session'].browse(int(session_id))
        bnk_stmt = session.cash_register_id
        if (balance == 'start'):
            self = session.cash_register_id.cashbox_start_id
        else:
            self = session.cash_register_id.cashbox_end_id
        if not self:
            self = self.create({'description': "Created from POS"})
            if self and (balance == 'end'):
                account_bank_statement = session.cash_register_id
                account_bank_statement.write({'cashbox_end_id': self.id})
        for val in values:
            id = val['id']
            number = val['number']
            coin_value = val['coin_value']
            cashbox_line = self.env['account.cashbox.line']
            if id and number and coin_value:  # Add new Row
                cashbox_line = cashbox_line.browse(id)
                cashbox_line.write({'number': number,
                                    'coin_value': coin_value
                                    })
            elif not id and number and coin_value:   # Add new Row
                cashbox_line.create({'number': number,
                                     'coin_value': coin_value,
                                     'cashbox_id': self.id
                                     })
            elif id and not (number and coin_value):  # Delete Exist Row
                cashbox_line = cashbox_line.browse(id)
                cashbox_line.unlink()

        total = 0.0
        for lines in self.cashbox_lines_ids:
            total += lines.subtotal
        if (balance == 'start'):
            # starting balance
            bnk_stmt.write({'balance_start': total,
                            'cashbox_start_id': self.id})
        else:
            # closing balance
            bnk_stmt.write({'balance_end_real': total,
                            'cashbox_end_id': self.id})
        if (balance == 'end'):
            if bnk_stmt.difference < 0:
                if self.env.user.id == SUPERUSER_ID:
                    return (_('you have to send more %s %s') %
                            (bnk_stmt.currency_id.symbol,
                             abs(bnk_stmt.difference)))
                else:
                    return (_('you have to send more amount'))
            elif bnk_stmt.difference > 0:
                if self.env.user.id == SUPERUSER_ID:
                    return (_('you may be missed some bills equal to %s %s')
                            % (bnk_stmt.currency_id.symbol,
                               abs(bnk_stmt.difference)))
                else:
                    return (_('you may be missed some bills'))
            else:
                return (_('you done a Great Job'))
        else:
            return

    @api.multi
    def validate(self):
        """Raise popup for set closing balance in session POS

        :rtype: dict

        """
        res = super(AccountBankStmtCashWizard, self).validate()
        bnk_stmt_id = (self.env.context.get('bank_statement_id', False) or
                       self.env.context.get('active_id', False))
        bnk_stmt = self.env['account.bank.statement'].browse(bnk_stmt_id)
        if bnk_stmt.pos_session_id.state == 'closing_control':
            if bnk_stmt.difference < 0:
                raise UserError(_('you have to send more %s %s') % (
                    bnk_stmt.currency_id.symbol,
                    abs(bnk_stmt.difference)))
            elif bnk_stmt.difference > 0:
                raise UserError(_('you may be missed some '
                                  'bills equal to %s %s') % (
                                      bnk_stmt.currency_id.symbol,
                                      abs(bnk_stmt.difference)))
            else:
                return res
        else:
            return res
