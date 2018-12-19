# -*- coding: utf-8 -*-

{
    'name': 'POS Hotel Management',
    'version': '0.1.0',
    'summary': 'POS Hotel Management',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'price': 29,
    'currency': 'EUR',
    #'images': ['images/main_screenshot.png'],
    'depends': ['base', 'point_of_sale', 'laundry_management'],
    'data': [
        'views/point_of_sale.xml',
    ],
    'qweb': ['static/src/xml/pos.xml'],
    #'css': ['static/src/css/giftcard.css'],
    'installable': True,
    'auto_install': False,
    'application': True,
}
