# -*- coding: utf-8 -*-
from odoo import models, fields


class SkitStepDiscount(models.Model):
    """
    Skit Step Discount.
    Creates step discount.
    """
    _name = 'skit.step.discount'
    _description = "Step Discount"

    name = fields.Char(
        string="Discount Name",
        required=True,
        help="Name for the Discount",
    )
    discount_percentage = fields.Float(
        string="Percent Discount (%)",
        help="Percent Discount"
    )
    product_id = fields.Many2one(
        'product.product',
        string="Product",
        required=True,
        default=lambda self: self.env['product.product'].search(
                            [('name', '=', 'Step Discount')])
    )
