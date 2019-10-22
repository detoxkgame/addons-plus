from odoo import api, fields, models, _

class ProductTemplate(models.Model):

    _inherit = 'product.template'

    barcode_ids = fields.One2many(
        comodel_name="product.multi.barcode",
        compute="_compute_barcode_ids",
        inverse="_set_barcode_ids",
        string="Multi Barcode"
    )

    @api.depends('product_variant_ids', 'product_variant_ids.barcode_ids')
    def _compute_barcode_ids(self):
        for p in self:
            if len(p.product_variant_ids) == 1:
                p.barcode_ids = p.product_variant_ids.barcode_ids

    def _set_barcode_ids(self):
        for p in self:
            if len(p.product_variant_ids) == 1:
                p.product_variant_ids.barcode_ids = p.barcode_ids