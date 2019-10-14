# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

{
    'name': "Web Appointment",
    'summary': "Interactive visualization Resources in time",
    "version": "12.0.0.0.1",
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'category': "web",
    "application": False,
    "installable": True,
    'depends': [
        'web',
        'web_unsplash',
        'calendar'
    ],

    'data': [
        'views/web_appointment.xml',
        'views/calendar.xml',
    ],
    'qweb': [
        "static/src/xml/web_app_calendar.xml",
    ],
}
