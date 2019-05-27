# -*- coding: utf-8 -*-
# See LICENSE file for full copyright and licensing details.

from odoo.exceptions import ValidationError
from odoo import models, fields, tools, api, _
from decimal import Decimal
from odoo.addons import decimal_precision as dp


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
                                       string="Old Room Type")
    new_room_type_id = fields.Many2one('product.category',
                                       string="New Room Type")
    old_plan_type_id = fields.Many2one('hm.plan.type', string="Old Plan Type")
    new_plan_type_id = fields.Many2one('hm.plan.type', string="New Plan Type")
    pos_order_id = fields.Many2one('pos.order', string="Folio")
    remark = fields.Text(string="Remark")


class HotelRoomBlock(models.Model):

    _name = "hm.block.room"
    _description = "Hotel Room Block"

    room_id = fields.Many2one('product.product', string="Room No")
    from_date = fields.Datetime(string="From Date", required=True)
    to_date = fields.Datetime(string="To Date", required=True)
    remark = fields.Text(string="Remark")
    state = fields.Selection([('draft', 'Draft'),
                              ('block', 'Block'),
                              ('unblock', 'Unblock')],
                             'Status', default='draft')


class GuestIDProof(models.Model):

    _name = "hm.guest.id.proof"
    _rec_name = "proof_type"
    _description = "Guest ID Proof"

    proof_type = fields.Char(string="Proof Type")


class HotelReferred(models.Model):

    _name = "hm.referred"
    _description = "Hotel Referred By"
    _rec_name = 'referred_by'

    referred_by = fields.Char(string=" Reffered By")
    referred_line_ids = fields.One2many('hm.referred.line',
                                        'referred_by_id',
                                        string='Referred By Line',
                                        copy=True)
    commission = fields.Float(string='Commission', digits=0)
    commision_type = fields.Selection([('fixed', 'Fixed'),
                                       ('percentage', 'Percentage')],
                                      default='fixed')


class HotelReferredLine(models.Model):

    _name = "hm.referred.line"
    _description = "Hotel Referred By Line"

    name = fields.Char(string="Name")
    referred_by_id = fields.Many2one('hm.referred',
                                     string="Reffered By")
    agent_name = fields.Many2one('res.partner', required=True,
                                 domain=[('supplier', '=', True)],
                                 string="Agent Name")
    commission = fields.Float(string='Commission', digits=(16, 2))
    commision_type = fields.Selection([('fixed', 'Fixed'),
                                       ('percentage', 'Percentage')],
                                      default='fixed')


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
                             'Status', default='inprogress')
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


#===============================================================================
# class IrUiMenu(models.Model):
#     _inherit = 'ir.ui.menu'
# 
#     is_hotel_management = fields.Boolean(default=False)
#===============================================================================


class VendorDashboard(models.Model):

    _name = 'hm.vendor.dashboard'
    #_rec_name = 'vendor_category_id'

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
    dashboard_line_ids = fields.One2many('hm.vendor.dashboard.line',
                                         'vendor_dashboard_id',
                                         string="Dashboard Line",
                                         copy=True)
    color = fields.Char(string='Color Index')
    name = fields.Char(string='Name')
    dashboard_category = fields.Selection([
                    ('vendor_dashboard', _('Vendor Dashboard')),
                    ('reservation', _('Reservation')),
                    ('room_reservation', _('Room Reservation')),
                    ('checkout', _('CheckOut'))], string="Dashboard Category",
                                  default='')

    @api.onchange('vendor_category_id')
    def onchange_vendor_category_id(self):
        partner_category = self.env['res.partner.category'].search([
                         ('id', '=', self.vendor_category_id.id)])
        self.name = partner_category.name
        if partner_category and partner_category.name == 'Others':
            self.vendor_other_category = 'other'
        else:
            self.vendor_other_category = ''

    @api.model
    def create(self, vals):
        """ render image size """
        tools.image_resize_images(vals)
        res = super(VendorDashboard, self).create(vals)
        return res

    @api.multi
    def write(self, vals):
        """ render image size """
        tools.image_resize_images(vals)
        res = super(VendorDashboard, self).write(vals)
        return res


class VendorDashboardLine(models.Model):
    _name = 'hm.vendor.dashboard.line'
    _rec_name = 'dashboard_menu'

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
    dashboard_menu = fields.Many2one('ir.ui.menu',
                                     string="Dashboard Menu")
    vendor_dashboard_id = fields.Many2one('hm.vendor.dashboard',
                                          string="Vendor Dashboard")

    @api.model
    def create(self, vals):
        """ render image size """
        tools.image_resize_images(vals)
        res = super(VendorDashboardLine, self).create(vals)
        return res

    @api.multi
    def write(self, vals):
        """ render image size """
        tools.image_resize_images(vals)
        res = super(VendorDashboardLine, self).write(vals)
        return res


class FormTemplate(models.Model):
    _name = 'hm.form.template'

    name = fields.Char(string="Name")
    form_model_id = fields.Many2one('ir.model', string="Model Name")
    vendor_dashboard_id = fields.Many2one('hm.vendor.dashboard',
                                          string="Dashboard")
    vendor_dashboard_line_id = fields.Many2one('hm.vendor.dashboard.line',
                                               string="Dashboard Line")
    form_template_line_ids = fields.One2many('hm.form.template.line',
                                             'form_template_id',
                                             string='Form Template Line',
                                             copy=True)
    form_template_line_menu_ids = fields.One2many('hm.form.template.line',
                                                  'form_template_id',
                                                  domain=[('form_field_type',
                                                           'in', ('menu', 'logo'))],
                                                  string='Form Template Menu',
                                                  copy=True)
    form_view = fields.Selection([
                    ('form', _('Form')),
                    ('list', _('List')),
                    ('kanban', _('Kanban')),
                    ('report', _('Report')),
                    ('left_panel', _('Left Panel')),
                    ('right_panel', _('Right Panel')),
                    ('top_panel', _('Top Panel')),
                    ('center_panel', _('Center Panel')),
                    ('night_audit', _('Night Audit')),
                    ('restaurant_table', _('Restaurant Table')),
                    ('room_status_report', _('Room Status Report')),
                    ('search_view', _('Search View'))], string="Form View",
                                  default='')
    column_count = fields.Integer(string="Column Per Row", default=3)
    #===========================================================================
    # sub_form_template_ids = fields.One2many('hm.sub.form.template',
    #                                         'form_template_id',
    #                                         string='Sub Form Template',
    #                                         copy=True)
    #===========================================================================

    @api.onchange('vendor_dashboard_id')
    def _onchange_vendor_dashboard_id(self):
        dashboard = self.env['hm.vendor.dashboard']
        dashboard_val = dashboard.search([
                         ('id', '=', self.vendor_dashboard_id.id)])
        if dashboard_val:
            self.name = dashboard_val.vendor_category_id.name


class SubFormTemplate(models.Model):
    _name = 'hm.sub.form.template'

    name = fields.Char(string="Name")
    form_template_line_ids = fields.One2many('hm.sub.form.template.line',
                                             'sub_form_template_id',
                                             string='Form Template Line',
                                             copy=True)


class SubFormTemplateLine(models.Model):
    _name = 'hm.sub.form.template.line'

    name = fields.Char(string="Name")
    sequence = fields.Integer(string='Sequence')
    color = fields.Char(string='Color Index')
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
    sub_form_template_id = fields.Many2one('hm.sub.form.template',
                                       string='Form Template', copy=False)
    form_template_id = fields.Many2one('hm.form.template',
                                           #domain=[('form_view', '=', 'form')],
                                           string='Sub Form Template',
                                           copy=False)
    sub_dashboard_line_id = fields.Many2one('hm.vendor.dashboard.line',
                                            string="Dashboard Line",
                                            copy=False)

    @api.onchange('form_template_id')
    def _onchange_form_template_id(self):
        form_template = self.env['hm.form.template']
        form_template_val = form_template.search([
                         ('id', '=', self.form_template_id.id)])
        if form_template_val:
            self.sub_dashboard_line_id = form_template_val.vendor_dashboard_line_id.id

    @api.model
    def create(self, vals):
        """ render image size """
        tools.image_resize_images(vals)
        res = super(SubFormTemplateLine, self).create(vals)
        return res

    @api.multi
    def write(self, vals):
        """ render image size """
        tools.image_resize_images(vals)
        res = super(SubFormTemplateLine, self).write(vals)
        return res


class FormTemplateLine(models.Model):
    _name = 'hm.form.template.line'

    form_label = fields.Char(string='Label')
    form_field_id = fields.Many2one('ir.model.fields', string="Form Fields")
    form_field_type = fields.Selection([
        ('input_char', _('Input(Char)')),
        ('input_int', _('Input(Int)')),
        ('checkbox', _('CheckBox')),
        ('radio', _('Radio')),
        ('date', _('Date')),
        ('datetime', _('Date Time')),
        ('textarea', _('Text Area')),
        ('header_label', _('Header label')),
        ('selection', _('Selection')),
        ('label', _('Label')),
        ('image', _('Image')),
        ('many2many', _('Many2Many')),
        ('sub_form', _('Sub Form Template')),
        ('statusbar', _('Status Bar')),
        ('top_buttons', _('Top Buttons')),
        ('view_buttons', _('View Buttons')),
        ('button', _('Button')),
        ('many2one', _('Many2One')),
        ('empty_line', _('Empty Line')),
        ('input_intchar', _('Input(Int&char)')),
        ('tab', _('Tab')),
        ('menu', _('Menu')),
        ('logo', _('Logo')),
        ('search', _('Search')),
        ('left_panel', _('Left Panel')),
        ('right_panel', _('Right Panel')),
        ('top_panel', _('Top Panel')),
        ('center_panel', _('Center Panel'))], string='Field Type',
                                       required=True)

    sameline = fields.Boolean(string='Same Line')
    isMandatory = fields.Boolean(string='Mandatory')
    sequence = fields.Integer(string='Sequence')
    form_template_id = fields.Many2one('hm.form.template',
                                       string='Form Template', copy=False)
    form_placeholder = fields.Char(string='Placeholder')
    font_size = fields.Integer(string="Font Size")
    font_style = fields.Selection([
                    ('normal', _('Normal')),
                    ('italic', _('Italic')),
                    ('oblique', _('Oblique'))], string="Font Style",
                                  default="normal")
    font_family = fields.Char(string="Font Family")
    name = fields.Char(string="Name")
    form_template_selection_fields = fields.Many2many('hm.form.selection.item',
                                                      string='Selection items')
    sub_template_id = fields.Many2one('hm.sub.form.template',
                                      string='Sub Template', copy=False)
    form_template_model_fields = fields.Many2many('ir.model.fields',
                                                      string='display values')
    field_styles = fields.Char(string='Field Styles')
    field_group = fields.Selection([
        ('htmlheader', _('HTML<Header>')),
        ('htmlbody', _('HTML<Body>')),
        ('htmlfooter', _('HTML<Footer>'))], string='Field Group',
                                       required=False)
    #field_domain = fields.Char(string="Domain")
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
    model_name = fields.Char(string="Model Name")
    model_method = fields.Char(string="Model Method")
    description = fields.Char(string="Description")
    readonly = fields.Boolean(string='ReadOnly', default=False)

    @api.onchange('form_field_type')
    def change_form_field_type(self):
        if self.form_field_type == 'many2one' or self.form_field_type == 'many2many':
            if self.form_field_id.relation:
                ir_model = self.env['ir.model'].sudo().search([
                                ('model', '=', self.form_field_id.relation)])
                if ir_model:
                    return {'domain': {'form_template_model_fields': [
                                                ('model_id', '=', ir_model.id)]
                                }}


class FormTemplateSelectionItem(models.Model):
    _name = "hm.form.selection.item"
    _description = "Selection items for m2m fields in Form Template design"

    name = fields.Char(string='Name')
    value = fields.Char(string='Value of name field')


class CarType(models.Model):
    _name = "hm.car.type"

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
    name = fields.Char(string="Name")

    @api.model
    def create(self, vals):
        """ render image size """
        tools.image_resize_images(vals)
        res = super(CarType, self).create(vals)
        return res

    @api.multi
    def write(self, vals):
        """ render image size """
        tools.image_resize_images(vals)
        res = super(CarType, self).write(vals)
        return res


class IrModelFields(models.Model):
    _inherit = 'ir.model.fields'
    _description = "Fields"
    _order = "name asc"

    @api.multi
    def name_get(self):
        res = []
        if self._context.get('view_model_fields', False):
            for field in self:
                res.append((field.id, '%s' % (field.field_description)))
        else:
            for field in self:
                res.append((field.id, '%s (%s)' % (field.field_description,
                                                   field.model)))
        return res


class PosOrder(models.Model):

    _inherit = 'pos.order'

    guest_name = fields.Char(string="Guest Name")
    guest_proof_id = fields.Many2one('hm.guest.id.proof', string="Guest Proof")
    id_proof_no = fields.Char(string="ID No")
    checkin_date = fields.Datetime(string="CheckIn Date")
    checkout_date = fields.Datetime(string="CheckOut Date")
    is_reservation = fields.Boolean(string="Is Reservation")
    referred_by_id = fields.Many2one('hm.referred', string="Referred By")
    referred_by_name = fields.Many2one('hm.referred.line',
                                       string="Referred By Name")
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
    driver_name = fields.Char(string="Driver Name")
    car_no = fields.Char(string="Car Number")
    pickup_date = fields.Datetime(string="Pick Up")
    return_date = fields.Datetime(string="Return")
    vendor_mobile = fields.Char(string="Vendor Mobile")
    location = fields.Char(string="Location")
    capacity = fields.Integer(string="Person")
    car_type_id = fields.Many2one('hm.car.type', string="Car Type")
    charge = fields.Float(string='Charge',
                          digits=dp.get_precision('Product Price'))
    no_night = fields.Integer(string="No of Night")
    source_folio_id = fields.Many2one("pos.order", string='Source Folio')
    is_service_order = fields.Boolean(string="Is Service", default=False)
    service_status = fields.Selection([('draft', 'Draft'),
                                       ('delivered', 'Delivered'),
                                       ('close', 'Close')], 'Service Status',
                                      copy=False, default='draft')
    service_line_ids = fields.One2many('pos.order.line', 'source_order_id',
                                       string="Service Line", copy=True)
    order_zone = fields.Selection([
                        ('taxi', 'Taxi Service'),
                        ('laundry', 'Laundry Service'),
                        ('doctors', 'Doctor Service'),
                        ('vegetables', 'Vegetable Service'),
                        ('others', 'Other Service'),
                        ('room_service', 'Room Service')
                        ], string='Order Zone', readonly=True, index=True,
                                  copy=False)
    order_state = fields.Selection([
                        ('draft', 'Draft'),
                        ('booked', 'Booked'),
                        ('departure', 'Departure'),
                        ('drop', 'Drop'),
                        ('done', 'Done'),
                        ('cancel', 'Cancelled')
                    ], string='Order Status', readonly=True, index=True,
                                   copy=False, default='draft')
    is_commissionpaid = fields.Boolean(string="IsCommission Paid")
    room_id = fields.Many2one('product.product', string="Room No")
    vendor_id = fields.Many2one('res.partner', required=True,
                                domain=[('supplier', '=', True)],
                                string="Vendor")

    @api.onchange('referred_by_name')
    def _onchange_referred_by_name(self):
        referred_by_name = self.env['hm.referred.line']
        referred_name_val = referred_by_name.search([
                         ('id', '=', self.referred_by_name.id)])
        if referred_name_val:
            self.name = referred_name_val.name

    @api.onchange('referred_by_id')
    def _onchange_reffered_by(self):
        if self.referred_by_id:
            return {'domain': {'referred_by_name': [('referred_by_id', '=',
                                                     self.referred_by_id.id)],
                               }}

    @api.model
    def _process_order(self, pos_order):
        pos_order['to_invoice'] = True
        orders = super(PosOrder, self)._process_order(pos_order)
        if(orders):
            if pos_order.get('reservation_details'):
                post_order_details = pos_order.get('reservation_details')
                if post_order_details.get('order_line'):
                    order_lines = post_order_details.get('order_line')
                    i = 0
                    for line in orders.lines:
                        if(i < len(order_lines)):
                            line.update(order_lines[i])
                            taxes = line.product_id.taxes_id.compute_all(line.price_unit, line.order_id.pricelist_id.currency_id, line.qty, product=line.product_id, partner=False)
                            line.price_subtotal = taxes['total_excluded']
                            line.price_subtotal_incl = taxes['total_included']
                            i = i + 1
                del post_order_details['order_line']
                orders.update(post_order_details)
                currency = orders.pricelist_id.currency_id
                orders.amount_paid = sum(payment.amount for payment in orders.statement_ids)
                orders.amount_return = sum(payment.amount < 0 and payment.amount or 0 for payment in orders.statement_ids)
                orders.amount_tax = currency.round(sum(self._amount_line_tax(line, orders.fiscal_position_id) for line in orders.lines))
                amount_untaxed = currency.round(sum(line.price_subtotal for line in orders.lines))
                orders.amount_total = orders.amount_tax + amount_untaxed
            if pos_order.get('source_folio_id'):
                orders.update({'source_folio_id': pos_order.get('source_folio_id')})
                orders.update({'is_service_order': True})
            if pos_order.get('room_table_id'):
                orders.update({'table_id': pos_order.get('room_table_id')})
            if(pos_order.get('is_service_order')):
                orders.update({'is_service_order': pos_order.get('is_service_order')})
                orders.lines.update({'source_order_id': pos_order.get('source_folio_id')})
            pos_order_line = self.env['pos.order.line'].sudo().search([
                                        ('order_id', '=', orders.id)], limit=1)
            product_tmpl_id = pos_order_line.product_id.product_tmpl_id
            if (orders.reservation_status == 'reserved'):
                product_tmpl_id.write({'state': 'reserved'})
            if (orders.reservation_status == 'checkin'):
                product_tmpl_id.write({'state': 'occupied'})
            # create line product_history
            if not orders.is_service_order:
                room_detail = product_tmpl_id.product_history_line_ids.create({
                                'product_id': pos_order_line.product_id.id,
                                'product_tmpl_id': product_tmpl_id.id,
                                'order_id': orders.id,
                                'state': orders.reservation_status,
                                'date': orders.checkin_date,
                                'out_date': orders.checkout_date,
                                })
            product_history = self.env['product.history'].sudo().search([
                                        ('order_id', '=', orders.id)],
                                                order='id desc', limit=1)
            product_history.write({'state': orders.reservation_status})
        return orders


class PosOrderLine(models.Model):

    _inherit = 'pos.order.line'

    checkin_date = fields.Datetime(string="CheckIn Date")
    checkout_date = fields.Datetime(string="CheckOut Date")
    room_id = fields.Many2one('product.product', string="Room No")
    triff_charge = fields.Float(string='In Amount')
    plan_type_id = fields.Many2one('hm.plan.type', string="Room Plan Type")
    no_night = fields.Integer(string="No of Night")
    no_bed = fields.Integer(string="No of Bed")
    pax = fields.Integer(string="Pax")
    tariff_id = fields.Many2one('product.pricelist', string="Tariff Plan")
    user_id = fields.Many2one('res.users', string="Users")
    partner_id = fields.Many2one('res.partner', related="order_id.partner_id",
                                 string="Order Partner")
    adult = fields.Integer('Adult')
    child = fields.Integer('Child')
    room_type_id = fields.Many2one('product.category', domain=[
                                ('is_room', '=', True)], string="Room Type")
    source_order_id = fields.Many2one("pos.order", string='Source Order')


class SaleOrder(models.Model):

    _inherit = 'sale.order'

    guest_name = fields.Char(string="Guest Name")
    driver_name = fields.Char(string="Driver Name")
    car_no = fields.Char(string="Car Number")
    pickup_date = fields.Datetime(string="Pick Up")
    return_date = fields.Datetime(string="Return")
    vendor_mobile = fields.Char(string="Vendor Mobile")
    location = fields.Char(string="Location")
    capacity = fields.Integer(string="Person")
    car_type_id = fields.Many2one('hm.car.type', string="Car Type")
    charge = fields.Float(string='Charge', digits=dp.get_precision('Product Price'))
    pos_order_id = fields.Many2one('pos.order', string="Folio")
    order_state = fields.Selection([
        ('draft', 'Draft'),
        ('booked', 'Booked'),
        ('departure', 'Departure'),
        ('drop', 'Drop'),
        ('done', 'Done'),
        ('cancel', 'Cancelled')
    ], string='Order Status', readonly=True, index=True, copy=False, default='draft')
    room_id = fields.Many2one('product.product', string="Room No")


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
                              ('reserved', 'Reserved'),
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
    laundry_order_id = fields.Many2one('laundry.order', string="Laundry Order")
    # Invoice button


class Location(models.Model):
    _inherit = "stock.location"
    _description = "Inventory Locations"

    islaundry = fields.Boolean(string='Laundry')
    sequence = fields.Integer(string='Sequence')


class AccountInvoice(models.Model):

    _inherit = 'account.invoice'

    stock_picking_id = fields.Many2one('stock.picking',
                                       string="Inventory Move")
    pos_order_id = fields.Many2one('pos.order', string="Folio")


class PurchaseOrder(models.Model):

    _inherit = 'purchase.order'

    pos_order_id = fields.Many2one('pos.order', string="Service")


class AccountPayment(models.Model):

    _inherit = 'account.payment'

    pos_order_id = fields.Many2one('pos.order', string="Folio")
    guest_name_id = fields.Many2one('res.partner', string="Guest Name")
    room_id = fields.Many2one('product.product', string="Room No")
    id_proof_no = fields.Char(string="ID No")
    remark = fields.Text(string="Remark")


class POSorder(models.Model):
    _inherit = 'pos.order'

    reservation_status = fields.Selection(
        [('draft', 'Draft'),
         ('reserved', 'Reserved'),
         ('noshow', 'No show'),
         ('checkin', 'CheckIn'),
         ('checkout', 'CheckOut'),
         ('shift', 'Shifted'),
         ('extend', 'Extended'),
         ('block', 'Blocked'),
         ('cancel', 'Cancelled'),
         ('done', 'Posted')],
        'Reservation Status',  copy=False, default='draft')

    state = fields.Selection(
        [('draft', 'New'),
          ('cancel', 'Cancelled'),
          ('paid', 'Paid'),
          ('done', 'Posted'),
          ('invoiced', 'Invoiced')],
        'Status',  copy=False, default='draft')


class StockLocationRoute(models.Model):
    _inherit = "stock.location.route"

    pos_selectable = fields.Boolean("Selectable on POS Order Line")
