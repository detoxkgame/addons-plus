# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo import models, api, fields


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    sale_sync_field_ids = fields.Many2many('ir.model.fields',
                                           string='Synchronized Fields',
                                           domain=[('model', '=', 'sale.order')
                                                   ])

    @api.multi
    def set_values(self):
        super(ResConfigSettings, self).set_values()
        config_parameters = self.env["ir.config_parameter"].sudo()
        for record in self:
            config_parameters.sudo().set_param("pos_sale_sync.sale_sync_field_ids", ', '.join(str(x) for x in record.sale_sync_field_ids.ids))

    @api.multi
    def get_values(self):
        res = super(ResConfigSettings, self).get_values()
        config_parameters = self.env["ir.config_parameter"].sudo()
        sale_sync_field_ids = config_parameters.sudo().get_param("pos_sale_sync.sale_sync_field_ids", default=False)
        res.update(
            sale_sync_field_ids=sale_sync_field_ids and [int(x) for x in sale_sync_field_ids.split(',')],
        )
        return res
