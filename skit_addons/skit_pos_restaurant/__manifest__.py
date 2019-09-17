# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': "Skit POS Restaurant",
    'version': '1.1',
    'summary': """ POS Restaurant """,
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'description': """
        POS Restaurant
    """,

    'depends': ['point_of_sale', 'pos_multi_session_restaurant'],

    "data": [
        "views/pos_config_view.xml",
        "views/point_of_sale.xml",
    ],
    'qweb': ['static/src/xml/pos_kitchen.xml'],
    'installable': True,
    'auto_install': False,
    'application': True,
}
