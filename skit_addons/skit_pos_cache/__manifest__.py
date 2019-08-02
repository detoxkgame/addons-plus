# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'POS Quick Load - Product',
    'version': '1.1',
    'summary': 'Synchronization of POS product data',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'description': """
        Synchronization of POS data
    """,
    'price': 25,
    'currency': 'EUR',
    'images': ['images/main_screenshot.png'],
    'category': "Point of Sale",
    'depends': ['point_of_sale', 'pos_cache'],
    'qweb': ['static/src/xml/pos_cache.xml'],
    'data': ['views/pos_cache_template.xml',
             'security/ir.model.access.csv',
             ],

    'installable': True,
    'auto_install': False,
    'application': True,
}
