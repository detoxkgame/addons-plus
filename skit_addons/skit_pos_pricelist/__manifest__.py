# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': "POS Quick Lead - Pricelist",
    'version': '1.1',
    'summary': """Synchronization of POS price list item data""",
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'description': """
        Synchronization of POS Product PriceList Data
    """,
    'price': 35,
    'currency': 'EUR',
    'images': ['images/main_screenshot.png'],
    'category': 'Point Of Sale',
    'depends': ['point_of_sale', 'skit_pos_cache'],
    'qweb': ['static/src/xml/pos_pricelist_cache.xml'],
    'data': [
        'data/pos_pricelist_data.xml',
        'security/ir.model.access.csv',
        'views/pos_pricelist_views.xml',
        'views/pos_pricelist_templates.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
}
