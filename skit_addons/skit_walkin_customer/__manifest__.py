# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Skit Walkin Customer',
    'version': '0.1.0',
    'category': 'Sales, Point of sales',
    'sequence': 15,
    'summary': 'Walkin Customer',
    'author': 'Srikesh Infotech',
    'website': 'www.srikeshinfotech.com',
    'images': ['images/main_screenshot.png'],
    'price': 20,
    'currency': 'EUR',
    'depends': ['point_of_sale',
                'sale',
                'product'],
    'qweb': ['static/src/xml/walkin.xml'],
    'data': ['views/walkin_template.xml',
             'views/walkin_customer.xml',
    ],

    'installable': True,
    'auto_install': False,
    'application': True,
}
