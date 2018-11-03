# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Customer Log',
    'version': '1.1',
    'summary': 'Point of Sales Customer Log',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'description': """
        Display the all order details
    """,
    'price': 15,
    'currency': 'EUR',
    'images': ['images/main_screenshot.png'],
    'category': "Point of Sale",
    'depends': ['sale_management', 'point_of_sale'],
    'qweb': ['static/src/xml/pos.xml'],

    'data': ['views/customerlog_templates.xml'
             ],

    'installable': True,
    'auto_install': False,
    'application': True,
}
