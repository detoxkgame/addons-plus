# -*- coding: utf-8 -*-

from odoo import models, fields, api, _, tools
import datetime
import psycopg2
import logging

_logger = logging.getLogger(__name__)


class ServiceType(models.Model):

    _name = "hm.service.type"
    _description = "Service Types"

    name = fields.Char('Name')
    model_id = fields.Many2one('ir.model', string="Model")
    description = fields.Text("Description")
    sequence_no = fields.Integer("Sequence")


class RestaurantFloor(models.Model):

    _inherit = 'restaurant.table'
    _description = 'Restaurant Table'

    product_id = fields.Many2one('product.template', string="Room")


class HMSeviceLine(models.Model):

    _name = "hm.service.line"
    _description = "Hotel Management Service Line"

    product_id = fields.Many2one('product.product', string="Product")
    room_no = fields.Many2one('product.template', string="Room No")
    qty = fields.Float("Quantity")
    unit_price = fields.Float("Unit Price")
    discount = fields.Float("Discount")
    account_tax = fields.Many2many('account.tax', string="Taxes")
    price_subtotal = fields.Float(string='Subtotal w/o Tax', digits=0,
                                  readonly=True, required=True)
    price_subtotal_incl = fields.Float(string='Subtotal', digits=0,
                                       readonly=True, required=True)
    service_type = fields.Many2one('hm.service.type', string="Service Type")
    check_in = fields.Datetime("Service Check In")
    check_out = fields.Datetime("Service Check Out")
    session_id = fields.Many2one('pos.session', "Session")
    pos_order_id = fields.Many2one('pos.order', string="Folio No")


class PosOrder(models.Model):

    _inherit = 'pos.order'

    hm_service_line_ids = fields.One2many('hm.service.line',
                                          'pos_order_id',
                                          string="Service Line",
                                          copy=True)

    @api.model
    def create_from_ui(self, orders):
        # Keep only new orders
        submitted_references = [o['data']['name'] for o in orders]
        pos_order = self.search([('pos_reference', 'in', submitted_references)])
        existing_orders = pos_order.read(['pos_reference'])
        existing_references = set([o['pos_reference'] for o in existing_orders])
        orders_to_save = [o for o in orders if o['data']['name'] not in existing_references]
        order_ids = []

        for tmp_order in orders_to_save:
            to_invoice = tmp_order['to_invoice']
            order = tmp_order['data']
            if to_invoice:
                self._match_payment_to_invoice(order)
            pos_order = self._process_order(order)
            pos_service_line = self._process_service_lines(pos_order, order)
            order_ids.append(pos_order.id)

            try:
                pos_order.action_pos_order_paid()
            except psycopg2.OperationalError:
                # do not hide transactional errors, the order(s) won't be saved!
                raise
            except Exception as e:
                _logger.error('Could not fully process the POS Order: %s', tools.ustr(e))

            if to_invoice:
                pos_order.action_pos_order_invoice()
                pos_order.invoice_id.sudo().action_invoice_open()
                pos_order.account_move = pos_order.invoice_id.move_id
        return order_ids

    def _process_service_lines(self, order, service):
        print(service)
        lines = order.lines
        table = order.table_id.id
        roomno = self.env['restaurant.table'].search([('id', '=', table)])
        hm_service_line = self.env['hm.service.line']
        for line in lines:
            hm_service_line.create({
                                'product_id': line.product_id.id,
                                'room_no': roomno.product_id.id,
                                'qty': line.qty,
                                'unit_price': line.price_unit,
                                'discount': line.discount,
                                'account_tax': line.tax_ids,
                                'price_subtotal': line.price_subtotal,
                                'price_subtotal_incl': line.price_subtotal_incl,
                                'check_in': order.date_order,
                                'session_id': order.session_id.id,
                                'pos_order_id': order.id,
                                'service_type': service.get('service_type_id')
                                    })
        return hm_service_line

    def get_customer(self, table, roomno):
        order_line = self.env['pos.order.line'].search([('room_id', '=', roomno)])
        now = datetime.datetime.now()
        for line in order_line:
            # orders = self.search([('state', '=', 'checkin')])
            if line.order_id.state == 'checkin':
                if line.order_id.checkin_date <= now and now <= line.order_id.checkout_date:
                    return line.order_id.partner_id.id


class PosConfig(models.Model):
    _inherit = 'pos.config'

    is_room = fields.Boolean('Room Management')


class AccountJournal(models.Model):

    _inherit = 'account.journal'

    def get_paylater_journal(self):
        journal = self.search([('is_pay_later', '=', True)])
        if journal:
            return journal.id


class HMRoomSupplies(models.Model):

    _name = 'hm.room.supply'
    _description = "Room Supply"

    name = fields.Char('Name')
    notes = fields.Text('Notes')


class RoomSupplyDetails(models.Model):

    _name = 'room.supply.details'
    _description = "Room Supply Details"

    room_supply = fields.Many2one('hm.room.supply', "Room Supply")
    refilled = fields.Boolean("Refilled")
    room_manage_id = fields.Many2one('room.manage', string="Room Manage")


class HMRoomManage(models.Model):

    _name = 'room.manage'
    _description = "Room Manage"

    room_no = fields.Many2one('product.template', string="Room No")
    date = fields.Datetime("Date & Time")
    folio_no = fields.Many2one('pos.order', "Folio")
    supervisor = fields.Many2one('res.partner', "Supervisor")
    supplier = fields.Many2one('res.partner', "Supplier")
    room_supply_details = fields.One2many('room.supply.details',
                                          'room_manage_id',
                                          string="Room Supply Details",
                                          copy=True)


class HoueseKeeping(models.Model):

    _name = 'hm.house.keeping'
    _description = "House Keeping"

    supervisor = fields.Many2one('res.partner', "Supervisor")
    house_keeper = fields.Many2one('res.partner', "House Keeper")
    room_no = fields.Many2one('product.template', string="Room No")
    date = fields.Date("Date")
    folio_no = fields.Many2one('pos.order', "Folio")
    activity = fields.Text("House Keeping Activity")
    remarks = fields.Text("Remarks")
    cleaning_start = fields.Datetime("Start Cleaning")
    cleaning_end = fields.Datetime("End Cleaning")
    inspect_time = fields.Datetime("Inspect Time")
    state = fields.Selection([
        ('clean', _('Clean')),
        ('dirty', _('Dirty')),
        ('inspect', _('Inspected')),
        ('done', _('Done'))], string='Status', default='', required=False)
