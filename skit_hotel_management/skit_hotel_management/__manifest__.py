# -*- coding: utf-8 -*-

{
    'name': 'Hotel Management',
    'version': '1.1',
    'summary': 'Hotel Management',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'price': 100,
    'currency': 'EUR',
    'description': """
        Hotel Management
        """,
    #'images': ['images/main_screenshot.png'],
    'category': "Hotel Management",
    'depends': ['web', 'sale', 'purchase', 'point_of_sale'],
    'data': [
            'security/hotel_security.xml',
            'security/ir.model.access.csv',
            'views/hotel_view.xml',
            'views/pos_config.xml',
            
    ],
    'qweb': ['static/src/xml/pos_screen.xml'],
    'installable': True,
    'auto_install': False,
    'application': True,
}
