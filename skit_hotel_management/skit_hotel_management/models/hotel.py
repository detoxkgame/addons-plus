# -*- coding: utf-8 -*-
# See LICENSE file for full copyright and licensing details.

from odoo.exceptions import ValidationError
from odoo import models, fields, api, _
from decimal import Decimal


class HotelFloor(models.Model):

    _name = "hm.floor"
    _description = "Room Floors"

    name = fields.Char('Floor Name')


class HotelRoomShift(models.Model):

    _name = "hm.shift.room"
    _description = "Hotel Room Shift"

    old_room_id = fields.Many2one('product.product', string="Old Room No")
    new_room_id = fields.Many2one('product.product', string="New Room No")
    guest_name_id = fields.Many2one('res.partner', string="Guest Name")
    checkin_date = fields.Datetime(string="CheckIn Date")
    referred_by_id = fields.Many2one('hm.referred', string="Referred")
    old_room_type_id = fields.Many2one('product.category',
                                       string="Room Type")
    old_plan_type_id = fields.Many2one('hm.plan.type', string="Old Plan Type")
    new_plan_type_id = fields.Many2one('hm.plan.type', string="Old Plan Type")
    pos_order_id = fields.Many2one('pos.order', string="Folio")
    remark = fields.Text(string="Remark")


class HotelRoomBlock(models.Model):

    _name = "hm.block.room"
    _description = "Hotel Room Block"

    room_id = fields.Many2one('product.product', string="Room No")
    from_date = fields.Datetime(string="From Date", required=True)
    to_date = fields.Datetime(string="To Date", required=True)
    remark = fields.Text(string="Remark")


class GuestIDProof(models.Model):

    _name = "hm.guest.id.proof"
    _description = "Guest ID Proof"

    proof_type = fields.Char(string="Proof Type")


class HotelReferred(models.Model):

    _name = "hm.referred"
    _description = "Hotel Referred By"

    referred_by = fields.Char(string=" Reffered By")
    referred_line_ids = fields.One2many('hm.referred.line',
                                        'referred_by_id',
                                        string='Referred By Line',
                                        copy=True)


class HotelReferredLine(models.Model):

    _name = "hm.referred.line"
    _description = "Hotel Referred By Line"

    name = fields.Char(string="Name")
    referred_by_id = fields.Many2one('hm.referred',
                                     string="Reffered By")


class HotelReservation(models.Model):

    _name = "hm.reservation"
    _description = "Hotel Reservation"

    reservation_no = fields.Char(string="Reservation Number")
    guest_name = fields.Char(string="Guest Name")
    guest_name_id = fields.Many2one('res.partner', string="Guest Name")
    checkin_date = fields.Datetime(string="CheckIn Date")
    checkout_date = fields.Datetime(string="CheckOut Date")
    adult = fields.Integer('Adult')
    child = fields.Integer('Child')
    mobile = fields.Char(string="Mobile")
    email = fields.Char(string="Email")
    image = fields.Binary("Image", attachment=True,
                          help="This field holds the image used as avatar for \
        this contact, limited to 1024x1024px",)
    image_medium = fields.Binary("Medium-sized image", attachment=True,
                                 help="Medium-sized image of this contact. \
                            It is automatically \
                            resized as a 128x128px image, \
                            with aspect ratio preserved \
                         Use this field in form views or some kanban views.")

    image_small = fields.Binary("Small-sized image", attachment=True,
                                help="Small-sized image of this contact. It is automatically \
             resized as a 64x64px image, with aspect ratio preserved. \
             Use this field anywhere a small image is required.")
    reservation_line_ids = fields.One2many('hm.reservation.line',
                                           'reservation_id',
                                           string="Reservation Line",
                                           copy=True)
    state = fields.Selection([('draft', 'Draft'),
                              ('no_show', 'No Show'),
                              ('cancel', 'Cancel')],
                             'Status', default='draft')


class HotelReservationLine(models.Model):

    _name = "hm.reservation.line"
    _description = "Hotel Reservation Line"

    room_type_id = fields.Many2one('product.category', string="Room Type")
    room_id = fields.Many2one('product.product', string="Room No")
    reservation_id = fields.Many2one('hm.reservation', string="Reservation")


class HotelPlanType(models.Model):

    _name = "hm.plan.type"
    _description = "Hotel Plan Type"

    name = fields.Char(string="Plan Type")


class HotelCheckOutDateExtend(models.Model):

    _name = "hm.checkout.date.extend"
    _description = "CheckOut Date Extend"

    room_id = fields.Many2one('product.product', string="Room No")
    pos_order_id = fields.Many2one('pos.order', string="Folio No")
    checkin_date = fields.Datetime(string="CheckIn Date")
    checkout_date = fields.Datetime(string="CheckOut Date")
    extend_checkout_date = fields.Datetime(string="Extend CheckOut Date")
    remark = fields.Char(string="Remark")


class HotelComplaint(models.Model):

    _name = "hm.complaint"
    _description = "Hotel Complaint"

    room_id = fields.Many2one('product.product', string="Room No")
    guest_name_id = fields.Many2one('res.partner', string="Guest Name")
    complaint = fields.Text(string="Complaint")
    state = fields.Selection([('inprogress', 'In Progress'),
                              ('completed', 'Completed')],
                             'Status', default='available')
    pos_order_id = fields.Many2one('pos.order', string="Folio No")
    service_line_id = fields.Many2one('pos.order.line', string="Service")


class CurrencyExchange(models.Model):

    _name = "hm.currency.exchange"
    _description = "Currency Exchange"

    @api.depends('in_currency_id', 'out_currency_id', 'in_amount')
    def _compute_get_currency(self):
        '''
        When you change in_currency_id, out_currency_id or in_amount
        it will update the out_amount of the currency exchange
        ------------------------------------------------------
        @param self: object pointer
        '''
        for rec in self:
            rec.out_amount = 0.0
            if rec.in_currency_id:
                result = rec.get_rate(rec.in_currency_id.name,
                                      rec.out_currency_id.name)
                if rec.out_currency_id:
                    rec.rate = result
                    if rec.rate == Decimal('-1.00'):
                        raise ValidationError(_('Please Check Your Network \
                                                Connectivity.'))
                    rec.out_amount = (float(result) * float(rec.in_amount))

    @api.depends('out_amount', 'service_tax')
    def _compute_tax_change(self):
        '''
        When you change out_amount or service_tax
        it will update the total of the currency exchange
        -------------------------------------------------
        @param self: object pointer
        '''
        for rec in self:
            if rec.out_amount:
                ser_tax = ((rec.out_amount) * (float(rec.service_tax))) / 100
                rec.total = rec.out_amount + ser_tax

    name = fields.Char(string="Name")
    date = fields.Datetime(string="Date")
    in_currency_id = fields.Many2one('res.currency', string="In Currency",
                                     track_visibility='always')
    out_currency_id = fields.Many2one('res.currency', string="Out Currency",
                                      track_visibility='always')
    in_amount = fields.Float(string='In Amount', required=True)
    out_amount = fields.Float(string=' Amount', required=True)
    pos_order_id = fields.Many2one('pos.order', string="Folio")
    guest_name_id = fields.Many2one('res.partner', string="Guest Name")
    room_id = fields.Many2one('product.product', string="Room No")
    state = fields.Selection([('draft', 'Draft'), ('done', 'Done'),
                              ('cancel', 'Cancel')], 'State', default='draft')
    rate = fields.Float(compute="_compute_get_currency",
                        string='Rate (Per Unit)', size=64, readonly=True)
    service_tax = fields.Selection([('2', '2%'), ('5', '5%'), ('10', '10%')],
                                   'Service Tax', default='2')
    total = fields.Float(compute="_compute_tax_change", string='Total Amount')

    @api.constrains('out_curr')
    def check_out_curr(self):
        for cur in self:
            if cur.out_curr == cur.input_curr:
                raise ValidationError(_('Input currency and output currency '
                                        'must not be same'))


class VendorDashboard(models.Model):

    _name = 'hm.vendor.dashboard'

    vendor_category_id = fields.Many2one('res.partner.category',
                                         string="Vendor Category")
    sequence = fields.Integer(string='Sequence')
    vendor_other_category = fields.Selection([('other', 'Others')],
                                             'Other Vendors', default='')
    vendor_category_ids = fields.Many2many(
                            'res.partner.category',
                            'res_partner_category_dashboard_rel',
                            'vendor_dashboard_id', 'category_id',
                            string='Vendor Category')


class PosOrder(models.Model):

    _inherit = 'pos.order'

    guest_name = fields.Char(string="Guest Name")
    guest_proof_id = fields.Many2one('hm.guest.id.proof', string="Guest Proof")
    id_proof_no = fields.Char(string="ID No")
    checkin_date = fields.Datetime(string="CheckIn Date")
    checkout_date = fields.Datetime(string="CheckOut Date")
    is_reservation = fields.Boolean(string="Is Reservation")
    referred_by_id = fields.Many2one('hm.referred', string="Referred By")
    referred_by_name = fields.Char(string="Referred By Name")
    adult = fields.Integer('Adult')
    child = fields.Integer('Child')
    mobile = fields.Char(string="Mobile")
    email = fields.Char(string="Email")
    title = fields.Many2one('res.partner.title', string="Title")
    address = fields.Char(string="Address")
    zip = fields.Char(change_default=True)
    city = fields.Char()
    state_id = fields.Many2one("res.country.state", string='State',
                               ondelete='restrict')
    country_id = fields.Many2one('res.country', string='Country',
                                 ondelete='restrict')
    gender = fields.Selection([
        ('male', _('Male')),
        ('female', _('Female'))], string='Gender', default='', required=False)
    dob = fields.Date(string='Date of birth', index=True, copy=False)
    shift_room_ids = fields.One2many('hm.shift.room',
                                     'pos_order_id',
                                     string="Shift Room",
                                     copy=True)
    complaint_ids = fields.One2many('hm.complaint',
                                    'pos_order_id',
                                    string="Shift Room",
                                    copy=True)
    checkout_date_extend_ids = fields.One2many('hm.checkout.date.extend',
                                               'pos_order_id',
                                               string="Shift Room",
                                               copy=True)


class PosOrderLine(models.Model):

    _inherit = 'pos.order.line'

    checkin_date = fields.Datetime(string="CheckIn Date")
    checkout_date = fields.Datetime(string="CheckOut Date")
    room_id = fields.Many2one('product.product', string="Room No")
    triff_charge = fields.Float(string='In Amount')
    plan_type_id = fields.Many2one('hm.plan.type', string="Room Type")
    no_night = fields.Integer(string="No of Night")
    no_bed = fields.Integer(string="No of Bed")
    pax = fields.Integer(string="Pax")
    tariff_id = fields.Many2one('product.pricelist', string="Tariff Plan")
    user_id = fields.Many2one('res.users', string="Users")


class ProductCategory(models.Model):

    _inherit = 'product.category'

    is_room = fields.Boolean(string="Is Room")
    is_service = fields.Boolean(string="Is Service")
    is_amenities = fields.Boolean(string="Is Amenity")

class ProductTemplate(models.Model):

    _inherit = 'product.template'

    room_manager_id = fields.Many2one('res.users', string='Room Manager')
    room_floor_id = fields.Many2one('hm.floor', string="Floor")
    max_adult = fields.Integer('Max Adult')
    max_child = fields.Integer('Max Child')
    capacity = fields.Integer('Capacity')
    room_amenities_ids = fields.Many2many('product.product',
                                          'product_product_amenities_rel',
                                          'room_no_id', 'amenities_id',
                                          string='Room Amenities')
    state = fields.Selection([('available', 'Available'),
                              ('occupied', 'Occupied'),
                              ('blocked', 'Blocked')],
                             'Status', default='available')
    block_room_ids = fields.One2many('hm.block.room', 'room_id',
                                     string="Block Room", copy=True)


class ProductPriceList(models.Model):

    _inherit = 'product.pricelist'

    plan_type_id = fields.Many2one('hm.plan.type', string="Plan Type")


class InventoryMove(models.Model):

    _inherit = 'stock.picking'

    pos_order_id = fields.Many2one('pos.order', string="Folio")
    guest_name_id = fields.Many2one('res.partner', string="Guest Name")
    room_id = fields.Many2one('product.product', string="Room No")
    purchase_order_id = fields.Many2one('purchase.order')
    partner_id = fields.Many2one('res.partner', string="Partner")
    user_id = fields.Many2one('res.users', string="User")
    invoice_ids = fields.One2many('account.invoice', 'stock_picking_id',
                                  string="Invoices",
                                  copy=True)
    # Invoice button


class AccountInvoice(models.Model):

    _inherit = 'account.invoice'

    stock_picking_id = fields.Many2one('stock.picking',
                                       string="Inventory Move")


class PurchaseOrder(models.Model):

    _inherit = 'purchase.order'

    sale_order_id = fields.Many2one('pos.order', string="Service")


class AccountPayment(models.Model):

    _inherit = 'account.payment'

    pos_order_id = fields.Many2one('pos.order', string="Folio")
    guest_name_id = fields.Many2one('res.partner', string="Guest Name")
    room_id = fields.Many2one('product.product', string="Room No")
    id_proof_no = fields.Char(string="ID No")
    remark = fields.Text(string="Remark")
