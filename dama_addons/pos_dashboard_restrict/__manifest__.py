# -*- coding: utf-8 -*-
# Copyright (C) 2017-Today  Technaureus Info Solutions(<http://technaureus.com/>).
{
    'name': 'POS Dashboard User',
    'version': '1.0',
    'sequence': 1,
    'category': 'point_of_sale',
    'summary': 'Restrict the user privilege on the pos dashboard',
    'author': 'Technaureus Info Solutions Pvt. Ltd.',
    'website': 'http://www.technaureus.com/',

    'license': 'Other proprietary',
    'description': """
Restrict the user privilege on the pos dashboard.
        """,
    'depends': ['point_of_sale'],
    'data': [
        'views/pos_dashboard_restrict_inherit.xml',
    ],
    'images': ['images/main_screenshot.png'],
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': True,
    'live_test_url': 'https://www.youtube.com/watch?v=Nmf6yN3vKbE&t=96s'
}
