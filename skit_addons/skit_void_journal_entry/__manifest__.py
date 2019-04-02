# -*- coding: utf-8 -*-

{
    'name': 'Void Functionality for Journal Entry',
    'version': '1.1',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'summary':  'To void the unposted journal entry',
    'category': 'Accounting',
    'images': ['images/main_screenshot.png'],
    'depends': ['account', 'account_cancel'],
    'data': [
             'views/journal_entry_view.xml',
            ],
    'auto_install': False,
    'application': True,
    'installable': True,
}
