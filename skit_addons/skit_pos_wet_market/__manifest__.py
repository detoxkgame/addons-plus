# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': "Skit POS Wet Market",
    'version': '1.1',
    'summary': """ Display the checkout order in supplier view """,
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'description': """
        POS Wet Market
    """,

    'depends': ['account', 'point_of_sale', 'website_sale'],

    "data": [
        "views/pos_config_view.xml",
        "views/point_of_sale.xml",
        "views/sale_views.xml"
    ],
    'qweb': ['static/src/xml/pos_vendor_view.xml'],
    'installable': True,
    'auto_install': False,
    'application': True,
}
