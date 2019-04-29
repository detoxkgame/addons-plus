from odoo import api, fields, models, tools


class PosConfig(models.Model):
    _inherit = 'pos.config'

    image = fields.Binary('Background Image', attachment=True, help='A background image used to display the point of sale interface')

    image_medium = fields.Binary("Medium-sized image", attachment=True,
        help="Medium-sized image of this contact. It is automatically "\
             "resized as a 128x128px image, with aspect ratio preserved. "\
             "Use this field in form views or some kanban views.")
    image_small = fields.Binary("Small-sized image", attachment=True,
        help="Small-sized image of this contact. It is automatically "\
             "resized as a 64x64px image, with aspect ratio preserved. "\
             "Use this field anywhere a small image is required.")
    iface_room_service = fields.Boolean('Room Service')

    @api.model
    def create(self, vals):
        tools.image_resize_images(vals)
        return super(PosConfig, self).create(vals)

    @api.multi
    def write(self, vals):
        tools.image_resize_images(vals)
        return super(PosConfig, self).write(vals)


class RestaurantTable(models.Model):
    _inherit = 'restaurant.floor'

    is_room_service = fields.Boolean('Is RoomService', default=False,
                                     help="""If false, the room supply is deactivated and will
                                            not be available in the point of sale """)
