# -*- coding: utf-8 -*-

{
    'name': 'Order Lists in POS',
    'version': '1.1',
    'summary': 'This module helps to view all orders in POS',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'price': 25,
    'currency': 'EUR',
    'images': ['images/main_screenshot.png'],
    'depends': ['base', 'point_of_sale', 'account',
                'skit_pay_later'],
    'data': [
        'views/order_lists_template.xml',
    ],
    'qweb': ['static/src/xml/pos_order_lists.xml'],
    'installable': True,
    'auto_install': False,
    'application': True,
}
