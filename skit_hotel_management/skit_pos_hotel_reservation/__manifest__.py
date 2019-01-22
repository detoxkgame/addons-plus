# -*- coding: utf-8 -*-

{
    'name': 'Hotel Reservation',
    'version': '1.1',
    'summary': 'Hotel Reservation',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'price': 100,
    'currency': 'EUR',
    'description': """
        Hotel Reservation
        """,
    #'images': ['images/main_screenshot.png'],
    'category': "Hotel Management",
    'depends': ['point_of_sale'],
    'data': [
          
           'views/reservation_template.xml',
            
    ],
    'qweb': ['static/src/xml/reservation_page.xml'],
    'installable': True,
    'auto_install': False,
    'application': True,
}
