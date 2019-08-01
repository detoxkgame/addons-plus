# -*- coding: utf-8 -*-

{
    'name': 'Website Career',
    'summary': "This module adds career menu in Website with upload resume option.",
    'category': 'Website',
    'author': 'Srikesh Infotech',
    'company': 'Srikesh Infotech',
    'website': 'http://www.srikeshinfotech.com',
    'price': 30,
    'currency': 'EUR',
    'depends': [
                'website','hr_recruitment'
                ],
    'data': [
        'views/careers.xml',
        'views/library_menu.xml',
       ],
    'images': ['images/main_screenshot.png'],
    'license': "AGPL-3",
    'installable': True,
    'application': True,
    'auto_install': False,
}
