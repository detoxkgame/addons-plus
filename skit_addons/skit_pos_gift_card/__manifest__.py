# -*- coding: utf-8 -*-

{
    'name': 'POS Gift Card',
    'version': '0.1.0',
    'summary': 'This module helps to send Gift Card to the customer',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'price': 29,
    'currency': 'EUR',
    'images': ['images/main_screenshot.png'],
    'depends': ['base','point_of_sale'],
    'data': [
        'views/pos_gift_card_views.xml',
        'views/pos_gift_card_templates.xml',
        'report/gift_card_template.xml',
        'report/gift_card_report.xml',
        'report/pos_gift_card_report.xml',
        'report/pos_gift_card_template.xml',
        'security/ir.model.access.csv',
        
    ],
    'qweb': ['static/src/xml/gift_card.xml'],
    'css': ['static/src/css/giftcard.css'],
    'installable': True,
    'auto_install': False,
    'application': True,
}
