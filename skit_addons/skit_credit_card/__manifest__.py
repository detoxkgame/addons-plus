{
    'name': 'Credit Card Charges',
    'version': '1.2',
    'summary': 'Apply Card Charges in POS order, invoice & new journal line',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'price': 30,
    'currency': 'EUR',
    'description': """
        Apply Card Charges in POS order, invoice & new journal line
    """,
    'depends': ['base', 'account', 'point_of_sale'],
    'images': ['images/main_screenshot.png'],
    'category': "Point of sales",
    'depends': ['base', 'account', 'point_of_sale'],
    'qweb': ['static/src/xml/credit_card_payment.xml'],
    'data': [
             'views/skit_credit_card_templates.xml',
             'views/skit_credit_card_charge_view.xml',
             'report/report_card_charge.xml',
             ],
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': True,
}
