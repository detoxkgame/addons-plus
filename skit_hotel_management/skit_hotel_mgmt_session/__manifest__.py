# -*- coding: utf-8 -*-

{
    'name': 'Hotel Management Session',
    'version': '1.1',
    'summary': 'Hotel Management',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'price': 100,
    'currency': 'EUR',
    'description': """
        Hotel Management Session
        """,
    #'images': ['images/main_screenshot.png'],
    'category': "Hotel Management",
    'depends': ['sale', 'purchase', 'point_of_sale'],
    'data': [
            'security/ir.model.access.csv',
            'views/hm_session_view.xml'
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
}
