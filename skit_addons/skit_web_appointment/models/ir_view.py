# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from openerp import fields, models


APPOINTMENT_VIEW = ('appointment', 'Appointment')


class IrUIView(models.Model):
    _inherit = 'ir.ui.view'

    type = fields.Selection(selection_add=[APPOINTMENT_VIEW])
