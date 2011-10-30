from django.contrib.sitemaps import Sitemap
from django.core.urlresolvers import reverse
from yacs.courses import models

import datetime

class SemesterSitemap(Sitemap):
    changefreq = 'hourly'

    def items(self):
        return models.Semester.objects.all()

    def lastmod(self, obj):
        return obj.date_updated

    def location(self, obj):
        r = reverse('departments', kwargs=dict(year=obj.year, month=obj.month))
        print r
        return r

sitemaps = {
    'semesters': SemesterSitemap,
}