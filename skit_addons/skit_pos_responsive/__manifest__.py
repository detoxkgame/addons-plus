# -*- coding: utf-8 -*-
{
    'name': "Responsive for pos screen",

    'summary': """
        Responsive for pos screen.
    """,

    'description': """
        Responsive for pos screen.
    """,
    'price': 25,
    'currency': 'EUR',
    'author': "Srikesh Infotech",
    'license': "AGPL-3",
    'website': "www.srikeshinfotech.com",
    'category': 'point_of_sale',
    'version': '10.0.0.1',
    'depends': ['point_of_sale','pos_restaurant','barcodes'],
    'qweb': ['static/src/xml/pos.xml',
     ],
    'data': [
        'views/pos_responsive.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
}
