# -*- coding: utf-8 -*-
from odoo import models, fields


class ProductTemplate(models.Model):
    _inherit = 'product.template'
    """ inherit the product model and add is_step_discount product checkbox"""

    is_step_discount_product = fields.Boolean(string="Is Step discount Product",
                                              default=False)


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
                             [('is_step_discount_product', '=', True)])
    )
