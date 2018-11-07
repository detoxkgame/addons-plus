from odoo import fields, models, api
from datetime import datetime


class skit_gift_voucher(models.Model):
    _name = 'skit.gift.voucher'
    _description = "Gift Voucher"

    voucher_code = fields.Char("Gift Card Number")

    amount = fields.Float("Amount")

    voucher_value = fields.Float("Gift Card Amount")

    gift_card = fields.Many2one('skit.pos.gift.card', 'Gift Card')

    order_line_id = fields.Many2one(
                    'pos.order.line',
                    string='POS Order Line',
    )

    order_id = fields.Many2one(
        'pos.order',
        string='Order No', compute='compute_order',
    )

    transaction_type = fields.Selection([('credit', 'Credit'),
                                         ('debit', 'Debit')],
                                        string='Transaction Type',
                                        default='credit')

    def compute_order(self):
        for vals in self:
            vals.order_id = vals.order_line_id.order_id.id


class SkitPosGiftCard(models.Model):
    """Skit Pos Gift Card
       Gift Card for the customer benefited for the special occasions.
    """
    _name = 'skit.pos.gift.card'
    _description = "Point of Sale Gift Card"

    @api.depends('pos_order_line_id')
    def _compute_voucher(self):
        for gift in self:
            vouchers = self.env['skit.gift.voucher'].search([
                ('gift_card', '=', gift.id)])
            gift.voucher_ids = vouchers

    today_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    gift_card_number = fields.Char(
        string="Gift Card Number",
        required=True,
    )
    date = fields.Datetime(
        string="Issue Date",
        required=True,
        default=today_date
    )
    customer = fields.Many2one(
        'res.partner',
        string="Customer",
    )
    gift_to = fields.Char(
        string="To",
        required=True,
    )
    gift_from = fields.Char(
        string="From",
        required=True,
    )
    gift_message = fields.Text(
        string="Message"
    )
    gift_qty = fields.Integer(
        string="Quantity",
        required=True,
    )
    price = fields.Integer(
        string="Price",
        required=True,
    )
    total_amount = fields.Integer(
        string="Total Amount",
        required=True,
    )
    session_id = fields.Many2one(
        'pos.session',
        string='Session',
        required=True,
    )
    order_id = fields.Many2one(
        'pos.order',
        string='Order No', compute='_get_order',
    )
    barcode = fields.Char(
        string="Barcode",
    )
    pos_order_line_id = fields.Many2one(
                    'pos.order.line',
                    string='POS Order Line',
    )

    voucher_ids = fields.Many2many('skit.gift.voucher',
                                   compute='_compute_voucher',
                                   string='Voucher')

    @api.multi
    def action_view_voucher(self):
        voucher = self.env['skit.gift.voucher'].search([
            ('voucher_code', '=', self.gift_card_number)])
        for vals in voucher:
            orderline = self.env['pos.order.line'].search(
                [('gift_voucher_ids', 'in', vals.id)])
            vals.order_id = orderline.order_id.id
            vals.gift_card = self.id
        [action] = self.env.ref('skit_pos_gift_card.action_gift_voucher').read()
        ids = []
        for coupon in self:
            ids.append(coupon.id)
        action['domain'] = [('gift_card', 'in', ids)]
        return action

    def _get_order(self):
        for card in self:
            card.order_id = card.pos_order_line_id.order_id.id

    @api.multi
    def invoice_print(self, order_name):
        """ Print the invoice and mark it as sent, so that we can see more
            easily the next step of the workflow
        """
        order = self.env['pos.order'].search([
            ('pos_reference', '=', order_name)])

        for line in order.lines:
            gift = self.search([('pos_order_line_id', '=', line.id)])
            values = {'gift': gift.id,
                      }
            if gift:
                return values
        return True

    def get_product(self, code, amt):
        template_id = self.env['product.template'].search([
            ('name', 'ilike', 'Gift Voucher')])
        product = self.env['product.product'].search([
            ('product_tmpl_id', '=', template_id.id),
            ('available_in_pos', '=', True)])
        gift_coupon = self.search([('barcode', '=', code)])
        gift_voucher = self.env['skit.gift.voucher'].search([('voucher_code', '=', code)])
        voucher_amt = 0
        for voucher in gift_voucher:
            if voucher.transaction_type != 'credit':
                voucher_amt += voucher.amount
        coupon_amount = float(amt) + voucher_amt
        if gift_coupon and gift_voucher:
            if coupon_amount <= gift_coupon.total_amount:
                voucher_exist = False
            else:
                voucher_exist = True
        else:
            voucher_exist = False
        values = {'product': product.id,
                  'amount': gift_coupon.total_amount,
                  'gift_card': gift_coupon.id,
                  'voucher_exist': voucher_exist
                  }
        return values

    def get_amount(self, code):
        gift_coupon = self.search([('barcode', '=', code)])
        gift_voucher = self.env['skit.gift.voucher'].search([('voucher_code', '=', code)])
        if gift_coupon and gift_voucher:
            amount = 0
            for voucher in gift_voucher:
                if voucher.transaction_type != 'credit':
                    amount += voucher.amount
            val = gift_coupon.total_amount - amount
            return val
        else:
            val = gift_coupon.total_amount
            return val


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    gift_card_ids = fields.One2many(
            'skit.pos.gift.card',
            'pos_order_line_id',
            string='Gift Card'
    )
    gift_voucher_ids = fields.One2many(
            'skit.gift.voucher',
            'order_line_id',
            string='Gift Voucher'
    )


class PosConfig(models.Model):
    _inherit = 'pos.config'

    gift_product_id = fields.Many2one('product.product',
                                      string='Gift Product',
                                      domain="[('available_in_pos', '=', True)]",
                                      help='The product used to \
                                      model the discount')
