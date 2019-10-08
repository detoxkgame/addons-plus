# -*- coding: utf-8 -*-

from odoo import api, fields, models, _


class ProductCategory(models.Model):
    _inherit = "product.category"

    is_grade = fields.Boolean(string='Is Grade', default=False)


class Channel(models.Model):
    _inherit = 'slide.channel'

    product_categ_id = fields.Many2one('product.category', string='Grade',
                                       domain="[('is_grade', '=', True)]")


class PricelistItem(models.Model):
    _inherit = "product.pricelist.item"

    applied_on = fields.Selection([
        ('3_global', 'Global'),
        ('2_product_category', ' Product Category'),
        ('1_product', 'Product'),
        ('0_product_variant', 'Product Variant')], "Apply On",
        default='2_product_category', required=True,
        help='Pricelist Item applicable on selected option')

    name = fields.Char(
        'Name',
        compute=False,
        help="Explicit rule name for this pricelist line.")

    @api.one
    @api.depends('categ_id', 'product_tmpl_id', 'product_id', 'compute_price', 'fixed_price', \
        'pricelist_id', 'percent_price', 'price_discount', 'price_surcharge')
    def _get_pricelist_item_name_price(self):
        #=======================================================================
        # if self.categ_id:
        #     self.name = _("Category: %s") % (self.categ_id.name)
        # elif self.product_tmpl_id:
        #     self.name = self.product_tmpl_id.name
        # elif self.product_id:
        #     self.name = self.product_id.display_name.replace('[%s]' % self.product_id.code, '')
        # else:
        #     self.name = _("All Products")
        #=======================================================================

        if self.compute_price == 'fixed':
            self.price = ("%s %s") % (self.fixed_price, self.pricelist_id.currency_id.name)
        elif self.compute_price == 'percentage':
            self.price = _("%s %% discount") % (self.percent_price)
        else:
            self.price = _("%s %% discount and %s surcharge") % (self.price_discount, self.price_surcharge)
