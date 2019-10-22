from odoo import api, fields, models, _


class ProductMultiBarcode(models.Model):

    _name = 'product.multi.barcode'

    name = fields.Char('Barcode', required=True)
    product_id = fields.Many2one(
        comodel_name="product.product",
        string="Product",
        required=True,
        ondelete='cascade'
    )
    active = fields.Boolean(related="product_id.active", store=True)
    available_in_pos = fields.Boolean(
        related="product_id.available_in_pos",
        store=True
    )

    _sql_constraints = [
        ('uniq_multi_barcode', 'unique(name, product_id)',
         'Multi barcode should be unique for each product. '
         'Please check again!.'),
    ]