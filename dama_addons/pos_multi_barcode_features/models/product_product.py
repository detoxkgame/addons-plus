from odoo import api, fields, models, _

class ProductProduct(models.Model):

    _inherit = 'product.product'

    barcode_ids = fields.One2many(
        comodel_name="product.multi.barcode",
        inverse_name="product_id",
        string="Multi Barcode"
    )

    @api.model
    def compute_multi_barcode_product_domain(self, args):
        """
        :param args: original args
        :return: new arguments that allow search more multi barcode object
        """
        domain = []
        for arg in args:
            if isinstance(arg, (list, tuple)) and arg[0] == 'barcode':
                domain += ['|', ('barcode_ids.name', arg[1], arg[2]), arg]
            else:
                domain += [arg]
        return domain

    @api.model
    def _search(self, args, offset=0, limit=None,
        order=None, count=False, access_rights_uid=None):

        new_args = self.compute_multi_barcode_product_domain(args)
        return super(ProductProduct, self)._search(
            new_args, offset, limit, order, count,
            access_rights_uid
        )
