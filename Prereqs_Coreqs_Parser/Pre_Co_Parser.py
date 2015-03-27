import urllib2

def Parse_HTML(HTML):
    in_tag = False
    #non_HTML = ""
    last = ''
    Parsed = []
    word = ""
    for x in HTML:
        if (x=='<'):
            in_tag = True
        elif (last=='>'):
            in_tag = False

        if (in_tag == False):
            if (x.isdigit() or x.isalpha()):
                word = "%s%s" %(word,x)
            else:
                if word:
                    Parsed.append(word)
                    word = ""

        last = x
    return Parsed

def Parse_Pre_Co(Parsed):
    new_parsed = []
    word = ""
    for x in Parsed:
        if (x.isdigit() or x.isalpha()):
            word = "%s%s" %(word,x)
        else:
            if word:
                new_parsed.append(word)
                word = ""

    return new_parsed

def Get_Pre_Co(Parsed):
    course = "%s %s" %(Parsed[0],Parsed[1])
    prereq_flag = False
    prereqs = ""
    coreq_flag = False
    coreqs = ""
    for x in Parsed:
        if (x=="Prerequisites"):
            prereq_flag = True
            coreq_flag = False
        elif (x=="Corequisite"):
            coreq_flag = True
            prereq_flag = False
        elif (x=="When" or x=="Credit"):
            coreq_flag = False
            prereq_flag = False
        if (prereq_flag):
            if (prereqs == ""):
                if (x=="Corequisites" or x=="Prerequisites" or x == "Prerequisite"):
                    continue
                prereqs = x
            else:
                prereqs = "%s %s" %(prereqs,x)
        elif (coreq_flag):
            if (coreqs == ""):
                if (x=="Corequisites" or x=="Prerequisites" or x=="Corequisite"):
                    continue
                coreqs = x
            else:
                coreqs = "%s %s" %(coreqs,x)
    return (course, prereqs, coreqs)

if __name__ == "__main__":

    '''
        For Semester_id = 13, course_id's go from 21969 to 24157
        2188 classes?
    '''
    semester_id = 13
    course_id = 21970
    '''
    url = "http://catalog.rpi.edu/preview_course_nopop.php?catoid=%d&coid=%d" %(semester_id,course_id)

    data = urllib2.urlopen(url)

    for line in data:
        line2 = Parse_HTML(line)
        if ("Prerequisites" in line2):
            line3 = Get_Pre_Co(line2)
            print line3
    '''
    preco = []
    while (course_id < 24158):

        url = "http://catalog.rpi.edu/preview_course_nopop.php?catoid=%d&coid=%d" %(semester_id,course_id)

        data = urllib2.urlopen(url)
        #print data

        for line in data:
            line2 = Parse_HTML(line)
            #line3 = Parse_Pre_Co(line2)
            if ("Prerequisites" in line2):
                line3 = Get_Pre_Co(line2)
                print line3
                preco.append(line3)
                #break

        course_id += 1
    print preco
    print len(preco)
    '''
    For 500 classes, ~4 min
    For all classes, ~14.5 min
    '''

