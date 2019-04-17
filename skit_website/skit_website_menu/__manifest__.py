# -*- coding: utf-8 -*-

{
    'name': 'Website for Srikesh Infotech',
    'summary': "Srikesh Infotech Website Design",
    'category': 'Website',
    'author': 'Srikesh Infotech',
    'company': 'Srikesh Infotech',
    'website': 'http://www.srikeshinfotech.com',
    'depends': [
                'website'
                ],
    'data': [
        'views/template.xml',
        'views/about.xml',
        'views/contact.xml',
        'views/careers.xml',
        'views/asset.xml',
        'views/navmenu_logo.xml',
       ],
    'qweb': ['src/xml/demo_template.xml'],
    'images': ['static/description/logo.png'],
    'license': "AGPL-3",
    'installable': True,
    'application': True,
    'auto_install': False,
}
