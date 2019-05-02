# -*- coding: utf-8 -*-

from odoo import models, fields, api, _, tools
from datetime import datetime
import psycopg2
import logging
import pytz
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT

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

    @api.onchange('product_id')
    def product_id_change(self):
        """ on change room_no update product name in table name
             @parma: product_id
        """
        # update table name on change product
        if self.product_id:
            # update product name in table name
            self.update({'name': self.product_id.name})
        else:
            self.update({'name': self.name})


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
    state = fields.Selection([('draft', 'Draft'),
                              ('delivered', 'Delivered'),
                              ('close', 'Close')], 'State',  copy=False,
                             default='draft')
    pos_order_line_id = fields.Many2one('pos.order.line', string="Pos Order Line")


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
            if(order.get('is_service_order')):
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
                                'pos_order_id': order.source_folio_id.id,
                                'service_type': service.get('service_type_id'),
                                'pos_order_line_id': line.id
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
    date = fields.Datetime("Requested Time")
    folio_no = fields.Many2one('pos.order', "Folio")
    supervisor = fields.Many2one('res.partner', "Supervisor")
    supplier = fields.Many2one('res.partner', "Room Attendant")
    room_supply_details = fields.One2many('room.supply.details',
                                          'room_manage_id',
                                          string="Room Supply Details",
                                          copy=True)
    closed_time = fields.Datetime("Closed Time")
    state = fields.Selection(
                [('draft', 'New'),
                 ('inprogress', 'In Progress'),
                 ('close', 'Close'),
                 ],
                'Status',  copy=False, default='draft')

    @api.model
    def create_supply_details(self, vals):
        if vals[0]['room_no']:
            room_manage = ({
                            'room_no': int(vals[0]['room_no']),
                            })
            res = super(HMRoomManage, self).create(room_manage)
            # Update room supply details
            room_supply_details = self.env['room.supply.details']
            rs_details = vals[0]['room_supply_details']
            room_supply_ids = []
            for supply_detail in rs_details:
                items = supply_detail['items']
                room_supply = room_supply_details.create({
                                            'room_supply': items['item_id'],
                                            'room_manage_id': res.id,
                                     })
                room_supply_ids.append(room_supply.id)
            # Update folio_no for respective room
            pos_order = self.env['pos.order'].sudo().search([
                                        ('reservation_status', '=', 'checkin')],
                                        limit=1, order='id desc')
            pos_order_line = self.env['pos.order.line'].sudo().search([
                                                ('product_id', '=', int(vals[0]['room_no'])),
                                                ('order_id', 'in', pos_order.ids)])
            if vals[0]['supplier_id']:
                supplier_id = self.env['res.partner'].sudo().search([
                                                ('id', '=',
                                                 int(vals[0]['supplier_id'])),
                                                ])
            order_id = pos_order_line.order_id.id
            res.write({'room_supply_details': [(6, 0, room_supply_ids)],
                       'date': res.create_date,
                       'state': 'inprogress',
                       'folio_no': order_id,
                       'supervisor': self.env.user.partner_id.id,
                       'supplier': supplier_id.id,
                       })
            return res

    @api.model
    def update_items_refilled(self, vals):
        if vals[0]['manage_id']:
            room_supply_ids = self.env['room.supply.details'].sudo().search([
                                                ('room_manage_id', '=',
                                                 int(vals[0]['manage_id'])),
                                                ])
            for items in room_supply_ids:
                items.write({
                             'refilled': True,
                             })
            room_manage_id = self.env['room.manage'].sudo().search([
                                ('id', '=', int(vals[0]['manage_id'])),
                                ])
            if room_manage_id:
                if vals[0]['supplier_id']:
                    supplier_id = self.env['res.partner'].sudo().search([
                                                ('id', '=',
                                                 int(vals[0]['supplier_id'])),
                                                ])
                #===============================================================
                # closedtime = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                # close_time = datetime.strptime(closedtime,
                #                                '%Y-%m-%d %H:%M:%S')
                # user_time_zone = pytz.UTC
                # if self.env.user.partner_id.tz:
                #     user_time_zone = pytz.timezone(
                #                             self.env.user.partner_id.tz)
                # # allocated_time time zone
                # closed_time = str(close_time)
                # utc_start = datetime.strptime(closed_time,
                #                               DEFAULT_SERVER_DATETIME_FORMAT)
                # utc = utc_start.replace(tzinfo=pytz.UTC)
                # from_actual_time = utc.astimezone(user_time_zone).strftime(
                #                             DEFAULT_SERVER_DATETIME_FORMAT)
                # closed_datetime = datetime.strptime(from_actual_time,
                #                                     '%Y-%m-%d %H:%M:%S')
                #===============================================================
                room_manage_id.write({
                                      'state': 'close',
                                      'supplier': supplier_id.id,
                                      })
                room_manage_id.write({
                                      'closed_time': room_manage_id.write_date,
                                      })
        return True


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
