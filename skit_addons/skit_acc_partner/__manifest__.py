# -*- encoding: utf-8 -*-
{
    'name': 'Journal entries',
    'version': '1.1',
    'category': 'Accounting & Finance',
    'summary': 'Adding customers and vendor',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'description': """
            This module allows you to add customer and vendors in a field.
    """,
    'website': 'http://www.srikeshinfotech.com',
    'data': [
        'views/account_partner.xml',
    ],
    'depends': [
        'account',
    ],
    'installable': True,
    'application': True,
}
